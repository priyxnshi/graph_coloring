import pandas as pd

# LOAD RESULTS
df = pd.read_csv("evaluation_results.csv")

print("=" * 70)
print("PERFORMANCE ANALYSIS")
print("=" * 70)

# BEST ACCURACY
best_accuracy_row = df.loc[
    df["Accuracy"].idxmax()
]

print("\nBEST ACCURACY MODEL")
print("-" * 40)

print(f"Dataset: {best_accuracy_row['Dataset']}")

print(f"Model: {best_accuracy_row['Model']}")

print(f"Accuracy: {best_accuracy_row['Accuracy']:.4f}")

# BEST F1 SCORE
best_f1_row = df.loc[
    df["F1 Score"].idxmax()
]

print("\nBEST F1 SCORE MODEL")
print("-" * 40)

print(f"Dataset: {best_f1_row['Dataset']}")

print(f"Model: {best_f1_row['Model']}")

print(f"F1 Score: {best_f1_row['F1 Score']:.4f}")

# LOWEST TRAINING TIME
fastest_row = df.loc[
    df["Training Time"].idxmin()
]

print("\nFASTEST MODEL")
print("-" * 40)

print(f"Dataset: {fastest_row['Dataset']}")

print(f"Model: {fastest_row['Model']}")

print(f"Training Time: {fastest_row['Training Time']:.6f}")

# DATASET-WISE SUMMARY
print("\nDATASET-WISE AVERAGE ACCURACY")
print("-" * 40)

summary = df.groupby("Dataset")[
    "Accuracy"
].mean()

print(summary)

# SAVE SUMMARY
summary.to_csv(
    "dataset_accuracy_summary.csv"
)

print("\nPerformance Analysis Completed.")