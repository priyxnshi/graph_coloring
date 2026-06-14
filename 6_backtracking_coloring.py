import pickle
import networkx as nx
import pandas as pd
import time
import logging

# LOGGING
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logging.info("Loading graph...")

# LOAD GRAPH
with open("feature_graph.pkl", "rb") as f:
    G = pickle.load(f)

nodes = list(G.nodes())

colors = {}

# SAFETY CHECK
def is_safe(node, color):

    for neighbor in G.neighbors(node):

        if neighbor in colors and colors[neighbor] == color:
            return False

    return True

# BACKTRACKING FUNCTION
def graph_coloring(index, max_colors):

    if index == len(nodes):
        return True

    node = nodes[index]

    for color in range(max_colors):

        if is_safe(node, color):

            colors[node] = color

            if graph_coloring(index + 1, max_colors):
                return True

            del colors[node]

    return False

logging.info("Applying Backtracking Graph Coloring...")

start_time = time.time()

# TRY COLORING
max_colors = 10

graph_coloring(0, max_colors)

end_time = time.time()

execution_time = end_time - start_time

# SAVE
with open("backtracking_coloring.pkl", "wb") as f:
    pickle.dump(colors, f)

# RESULTS
results = pd.DataFrame({
    "Feature": list(colors.keys()),
    "Color": list(colors.values())
})

results.to_csv(
    "backtracking_coloring_results.csv",
    index=False
)

logging.info("Backtracking Coloring Completed")
logging.info(f"Execution Time: {execution_time:.6f} seconds")

print("\nBACKTRACKING COLORING RESULTS")
print(results)