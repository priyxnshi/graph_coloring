import pandas as pd

# STEP 1: Load Correlation Matrix
correlation_matrix = pd.read_csv("correlation_matrix.csv", index_col=0)

# STEP 2: Set Threshold
threshold = 0.8

# STEP 3: Extract Conflict Pairs
conflicts = []

columns = correlation_matrix.columns

for i in range(len(columns)):
    for j in range(i + 1, len(columns)):

        corr_value = correlation_matrix.iloc[i, j]

        if abs(corr_value) > threshold:

            feature1 = columns[i]
            feature2 = columns[j]

            conflicts.append([feature1, feature2, corr_value])

# STEP 4: Convert to DataFrame
conflict_df = pd.DataFrame(
    conflicts,
    columns=["Feature1", "Feature2", "Correlation"]
)

# STEP 5: Save Conflict Pairs
conflict_df.to_csv("conflict_pairs.csv", index=False)

print("Conflict pairs saved as conflict_pairs.csv")

print("\nTotal Conflicts Found:")
print(len(conflicts))