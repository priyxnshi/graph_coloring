import pickle
import networkx as nx
import pandas as pd
import time
import logging

# LOGGING CONFIG
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logging.info("Loading graph...")

# LOAD GRAPH
with open("feature_graph.pkl", "rb") as f:
    G = pickle.load(f)

logging.info("Applying Greedy Graph Coloring...")

start_time = time.time()

# GREEDY COLORING
coloring = nx.coloring.greedy_color(
    G,
    strategy="largest_first"
)

end_time = time.time()

execution_time = end_time - start_time

# SAVE COLORING
with open("greedy_coloring.pkl", "wb") as f:
    pickle.dump(coloring, f)

# COLOR STATISTICS
num_colors = max(coloring.values()) + 1

logging.info(f"Greedy Coloring Completed")
logging.info(f"Colors Used: {num_colors}")
logging.info(f"Execution Time: {execution_time:.6f} seconds")

# SAVE RESULTS
results = pd.DataFrame({
    "Feature": list(coloring.keys()),
    "Color": list(coloring.values())
})

results.to_csv(
    "greedy_coloring_results.csv",
    index=False
)

print("\nGREEDY COLORING RESULTS")
print(results)

print("\nColoring saved as greedy_coloring.pkl")