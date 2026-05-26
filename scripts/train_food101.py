"""
Fine-tune ResNet-50 on Food-101 and save weights to app/ml/food101_resnet50.pth

Usage:
    python scripts/train_food101.py              # full run (~5 epochs, ~5 GB download)
    python scripts/train_food101.py --epochs 1   # quick sanity-check (less accurate)

The Food-101 dataset is downloaded automatically via torchvision (~5 GB).
GPU is used automatically if available; CPU works but is slower.

After it finishes, restart uvicorn — the model loads on next startup.
"""

import argparse
import os
import sys
from pathlib import Path

# ── Make sure we can import app.ml from the project root ─────────────────────
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.models import resnet50, ResNet50_Weights

# ── Args ──────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--epochs",    type=int, default=5,    help="Training epochs (default 5)")
parser.add_argument("--batch",     type=int, default=64,   help="Batch size (default 64)")
parser.add_argument("--lr",        type=float, default=1e-3)
parser.add_argument("--data-dir",  type=str, default=str(ROOT / "data"))
parser.add_argument("--out",       type=str, default=str(ROOT / "app/ml/food101_resnet50.pth"))
args = parser.parse_args()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# ── Transforms ────────────────────────────────────────────────────────────────
train_tf = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
val_tf = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

# ── Dataset (downloads automatically ~5 GB) ───────────────────────────────────
print(f"Loading Food-101 dataset into {args.data_dir} …")
train_ds = datasets.Food101(root=args.data_dir, split="train", transform=train_tf, download=True)
val_ds   = datasets.Food101(root=args.data_dir, split="test",  transform=val_tf,   download=True)

# Save class-to-index mapping as labels file (same order as dataset)
labels_path = ROOT / "app/ml/food101_labels.txt"
classes = train_ds.classes   # list of 101 names, sorted alphabetically
with open(labels_path, "w") as f:
    f.write("\n".join(classes) + "\n")
print(f"Saved {len(classes)} labels → {labels_path}")

train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True,  num_workers=4, pin_memory=True)
val_loader   = DataLoader(val_ds,   batch_size=args.batch, shuffle=False, num_workers=4, pin_memory=True)

# ── Model — start from ImageNet weights so fine-tuning converges fast ─────────
model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
model.fc = nn.Linear(model.fc.in_features, 101)
model = model.to(device)

# Only train the last block + FC for the first epoch, then unfreeze all
for name, p in model.named_parameters():
    p.requires_grad = ("layer4" in name or "fc" in name)

optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr)
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

# ── Training loop ─────────────────────────────────────────────────────────────
best_acc = 0.0
out_path = Path(args.out)
out_path.parent.mkdir(parents=True, exist_ok=True)

for epoch in range(1, args.epochs + 1):
    # Unfreeze all layers after epoch 1
    if epoch == 2:
        print("Unfreezing all layers …")
        for p in model.parameters():
            p.requires_grad = True
        optimizer = optim.AdamW(model.parameters(), lr=args.lr / 10)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs - 1)

    # ── Train ──────────────────────────────────────────────────────────────
    model.train()
    running_loss = correct = total = 0
    for i, (imgs, labels) in enumerate(train_loader):
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        loss = criterion(model(imgs), labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
        preds = model(imgs).argmax(1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
        if (i + 1) % 100 == 0:
            print(f"  Epoch {epoch}/{args.epochs}  step {i+1}/{len(train_loader)}  "
                  f"loss={running_loss/(i+1):.3f}  acc={correct/total:.3f}")

    # ── Validate ───────────────────────────────────────────────────────────
    model.eval()
    val_correct = val_total = 0
    with torch.no_grad():
        for imgs, labels in val_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            val_correct += (model(imgs).argmax(1) == labels).sum().item()
            val_total += labels.size(0)

    val_acc = val_correct / val_total
    print(f"Epoch {epoch}/{args.epochs}  val_acc={val_acc:.4f}")

    if val_acc > best_acc:
        best_acc = val_acc
        torch.save(model.state_dict(), out_path)
        print(f"  ✓ Saved best model → {out_path}  (acc={best_acc:.4f})")

    scheduler.step()

print(f"\nDone. Best val accuracy: {best_acc:.4f}")
print(f"Weights saved to: {out_path}")
print("Restart uvicorn — the model will load automatically on next startup.")
