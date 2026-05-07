from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
import pandas as pd

# STEP 1: Load Dataset
data = load_breast_cancer()

# Convert to DataFrame
df = pd.DataFrame(data.data, columns=data.feature_names)

print("Original Dataset Shape:")
print(df.shape)

# STEP 2: Check Missing Values
print("\nMissing Values:")
print(df.isnull().sum())

# STEP 3: Handle Missing Values (if any)
df = df.fillna(df.mean())

# STEP 4: Normalize Data
scaler = StandardScaler()

scaled_data = scaler.fit_transform(df)

df_scaled = pd.DataFrame(scaled_data, columns=df.columns)

# STEP 5: Save Cleaned Dataset
df_scaled.to_csv("cleaned_dataset.csv", index=False)

print("\nData preprocessing completed.")
print("Cleaned dataset saved as cleaned_dataset.csv")