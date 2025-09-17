import pandas as pd
import numpy as np

# Generate sample data
data = {
    'id': range(1, 101),
    'name': [f'User_{i}' for i in range(1, 101)],
    'age': np.random.randint(18, 65, 100),
    'salary': np.random.randint(30000, 120000, 100),
    'department': np.random.choice(['Engineering', 'Sales', 'Marketing', 'HR'], 100)
}

df = pd.DataFrame(data)
df.to_csv('large_dataset.csv', index=False)
print('Dataset created successfully!')

