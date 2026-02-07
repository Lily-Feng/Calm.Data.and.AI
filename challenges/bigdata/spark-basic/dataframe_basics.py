from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, sum as spark_sum, avg

# Initialize Spark Session
spark = SparkSession.builder \
    .appName("DataFrame Basics") \
    .master("local[*]") \
    .getOrCreate()

# Create sample data
data = [
    ("user1", "click", 1, "2024-01-01"),
    ("user1", "view", 1, "2024-01-01"),
    ("user1", "purchase", 50, "2024-01-02"),
    ("user2", "click", 1, "2024-01-01"),
    ("user2", "view", 1, "2024-01-01"),
    ("user2", "click", 1, "2024-01-02"),
    ("user3", "view", 1, "2024-01-01"),
    ("user3", "purchase", 100, "2024-01-03"),
]

columns = ["user_id", "event_type", "value", "event_date"]

# Create DataFrame
df = spark.createDataFrame(data, columns)

print("📊 Original DataFrame:")
df.show()

# 1. Filter: Only purchase events
purchases = df.filter(col("event_type") == "purchase")
print("🛒 Purchase Events:")
purchases.show()

# 2. Select specific columns
events_summary = df.select("user_id", "event_type", "value")
print("📋 Selected Columns:")
events_summary.show()

# 3. Group by user and count events
user_event_counts = df.groupBy("user_id") \
    .agg(
        count("*").alias("total_events"),
        spark_sum("value").alias("total_value")
    )
print("👤 Events per User:")
user_event_counts.show()

# 4. Group by event type with aggregations
event_stats = df.groupBy("event_type") \
    .agg(
        count("*").alias("count"),
        spark_sum("value").alias("total_value"),
        avg("value").alias("avg_value")
    ) \
    .orderBy(col("count").desc())
print("📈 Event Statistics:")
event_stats.show()

# Clean up
spark.stop()
