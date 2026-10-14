# An Analytics Systems Knowledge Map

*A practitioner's view of how data, semantics, computation, and delivery fit together*

I spent ten years working with MicroStrategy and eight years working with modern data stacks. This map brings those experiences together. MicroStrategy gave me a detailed view of what an enterprise analytics system has to do; the modern stack showed me how those responsibilities can be distributed across platforms, services, and code.

This is a map of **capabilities and decisions**, not a claim that MicroStrategy contained the entire data platform or that each of its features has a direct replacement. The useful question is: **where does each responsibility live, and what becomes easier or harder when it moves?**

## The map at a glance

| Layer | Core question | Where the responsibility often lives today |
| --- | --- | --- |
| Data foundations | How is data ingested, stored, and prepared? | Ingestion, transformation, storage, and query engines |
| Metadata and change | How are objects defined, governed, moved, and traced? | Catalogs, version control, deployment pipelines, and lineage systems |
| Business semantics | How do tables become consistent dimensions, facts, and metrics? | Semantic layers, metric definitions, and BI models |
| Query planning | How does a business request become executable SQL? | Semantic compilers, BI query generators, and database optimizers |
| Execution and acceleration | Where does computation happen, and what is reused? | Warehouses, federated engines, materialized views, caches, and serving stores |
| Platform operations | Who can access what, and how does the system stay reliable? | Data-platform policies, identity systems, workload controls, and observability |
| Consumption | How do people and applications use the result? | BI tools, embedded analytics, APIs, alerts, and AI interfaces |

## When the modern stack took shape

These dates mark public papers or releases, **not the invention of every underlying idea**. I use them to remember which pressure brought each capability into the modern data stack and where it sits in the map above.

| When | Shift | Why it mattered | Place in the map |
| --- | --- | --- | --- |
| 2004 | [MapReduce](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/) described fault-tolerant parallel batch work. | A framework could partition data, schedule tasks, and retry failures across ordinary machines. | Data foundations and execution |
| 2006 | [Amazon S3 launched](https://aws.amazon.com/about-aws/whats-new/2006/03/13/announcing-amazon-s3---simple-storage-service/). | Durable storage became an on-demand service rather than capacity tied to a particular compute cluster. | Data foundations |
| 2010 | [Spark was open-sourced](https://spark.apache.org/history) after beginning at Berkeley in 2009. | Iterative and interactive jobs needed to avoid writing every intermediate step to disk. | Execution |
| 2011 | [Kafka was open-sourced](https://www.linkedin.com/blog/engineering/open-source/project-kafka-distributed-publish-subscribe-messaging-system-reaches-v06). | High-volume events needed a durable log that producers and several consumers could use independently. | Data movement |
| 2013 | [Parquet was presented as an open columnar format](https://parquet.apache.org/docs/learning-resources/presentations/strata-2013/). | Analytical scans needed compact files that could skip irrelevant columns and be read by different engines. | Data foundations |
| 2014 | [Snowflake described a cloud-built warehouse with independent virtual warehouses](https://www.snowflake.com/en/blog/behind-snowflakes-name/). | Storage and compute could scale separately, and workloads could use different compute pools over shared data. | Data foundations and execution |
| 2015 | [Airflow was announced from Airbnb](https://airflow.apache.org/docs/apache-airflow/1.10.11/project.html). | Multi-step pipelines needed explicit dependencies, scheduling, retries, and a visible run history. | Metadata and change; platform operations |
| 2015 | [Spark SQL and DataFrames](https://people.csail.mit.edu/matei/papers/2015/sigmod_spark_sql.pdf) put a schema and optimizer over distributed computation. | Analysts and engineers could describe *what* to compute while Catalyst chose and revised the plan. | Query planning |
| 2016 | [Debezium's first release](https://debezium.io/archives/) offered an open connector path for log-based change data capture (CDC) from databases. | Repeated full extracts and timestamp polling miss deletes, add load, or leave long delays. Database log changes can become events. | Data movement |
| 2016 | [dbt began turning warehouse SQL into versioned models](https://www.getdbt.com/blog/dbt-core-v1-is-here). | Analysts needed modular transformations, tests, and reviewable changes alongside powerful cloud warehouses. | Data foundations; metadata and change |
| 2016 | [Structured Streaming arrived experimentally in Spark 2.0](https://spark.apache.org/releases/spark-release-2-0-0.html). | Teams needed to process unbounded events with the same DataFrame model used for batch data. | Execution and data movement |
| 2018 | [Spark 2.4 added `foreachBatch`](https://spark.apache.org/releases/spark-release-2-4-0.html). | Each micro-batch could be handed to custom sink logic, a useful bridge from change events to upserts. | Execution and delivery |
| 2018 | [Iceberg entered Apache incubation](https://incubator.apache.org/projects/iceberg.html). | Lakes needed a [table abstraction over files](https://iceberg.apache.org/spec/) so engines could share schemas and snapshots without relying on directory listings as the source of truth. | Data foundations; metadata and change |
| 2019 | [Delta Lake's open-source release](https://delta.io/blog/2019-04-22-delta-lake-0-1-0-released/) brought a transaction log to files in a data lake. | Incremental pipelines needed reliable updates and deletes, rather than only appending new files or rewriting whole datasets. | Data foundations and execution |
| 2020 | [Spark 3.0 added adaptive query execution](https://spark.apache.org/releases/spark-release-3-0-0.html). | A plan chosen before execution could be poor when the real data distribution differed from estimates; runtime statistics could improve it. | Query planning and execution |
| 2022 | [Unity Catalog reached public preview on AWS and Azure](https://www.databricks.com/blog/2022/04/20/announcing-gated-public-preview-of-unity-catalog-on-aws-and-azure.html). | More engines, workspaces, and asset types needed shared permissions, lineage, and auditability. | Metadata and change; platform operations |
| 2023 | [Delta Lake 2.3 exposed change data feeds through SQL](https://delta.io/blog/2023-05-02-delta-lake-2-3-0-released/). | Downstream consumers could query row-level table changes without comparing whole snapshots. This extended an existing change-feed capability; it did not originate CDC. | Data movement and delivery |
| 2023 | [The dbt Semantic Layer became generally available](https://docs.getdbt.com/blog/product-analytics-pipeline-with-dbt-semantic-layer). | Metrics defined in transformation code could be served consistently to multiple consumers. Shared semantics were an old need; this was a new interface for the distributed stack. | Business semantics and consumption |

### The CDC thread through the map

```text
Source database transaction log
    → CDC connector (for example, Debezium)
    → event log (for example, Kafka)
    → Spark Structured Streaming processes and deduplicates changes
    → transactional lake table applies inserts, updates, and deletes
    → downstream jobs read the current table or its change feed
```

CDC is **capture at the source**; Spark is a **processor of the resulting stream**. A table change feed is another boundary: it publishes changes made *to the analytical table*. Keeping those boundaries separate helps me reason about ordering, retries, deletes, schema changes, and which system owns the truth. See the [Debezium CDC model](https://debezium.io/documentation/reference/3.3/features.html), [Delta Lake's CDC `MERGE` example](https://docs.delta.io/delta-update/), and [Delta change data feed](https://docs.delta.io/delta-change-data-feed/).

## 1. Data foundations

MicroStrategy usually sat above a customer's warehouse and upstream ETL. That boundary matters: the warehouse, integration jobs, and storage design were essential to a successful MicroStrategy deployment, but they were not all MicroStrategy capabilities.

| Capability | What I saw through MicroStrategy | Modern-stack lens |
| --- | --- | --- |
| Source and warehouse data | Enterprise warehouses such as Teradata, Oracle, and Netezza supplied the data. | Cloud warehouses and lakehouses combine object storage, table formats, and multiple compute engines. |
| Ingestion and transformation | ETL commonly happened outside the BI platform, using tools such as Informatica or DataStage. | Ingestion, SQL transformation, and orchestration are usually explicit parts of the stack. |
| Logical data structures | Warehouse views and logical views helped shape the data available to analytics. | SQL models and data products make those transformations easier to version, test, and deploy. |
| Physical layout | Partitioning and warehouse design influenced query performance. | Table formats and query engines take on more of the partitioning, pruning, and optimization work. |

**What this layer taught me:** a semantic model cannot compensate indefinitely for unclear grain, unstable source data, or a poor physical design.

## 2. Metadata and change

MicroStrategy's metadata repository made a large analytics estate feel like one connected object system. Modern stacks often separate physical metadata, business definitions, deployment history, and lineage across several systems.

| Capability | MicroStrategy lens | Modern-stack lens |
| --- | --- | --- |
| Object identity and organization | Projects, metadata objects, and IDs connected reports to their definitions. | Catalogs describe data assets; version-controlled files often hold transformation and semantic definitions. |
| Promotion between environments | Object Manager moved selected objects and dependencies. | Git, pull requests, CI, and deployment pipelines promote code and configuration. |
| Dependency and impact analysis | The object graph made many report-to-metric relationships inspectable. | Lineage systems can cross more tools, but their coverage depends on what each tool emits. |

**The recurring question:** can I trace a changed column or metric all the way to the people, reports, APIs, and decisions it affects?

## 3. Business semantics

This is the part of MicroStrategy that most strongly shapes my mental model. Attributes, facts, metrics, filters, hierarchies, and prompts were not isolated features; together they formed a language for asking business questions. Modern semantic layers solve parts of the same problem, often with different modeling assumptions.

| Modeling question | MicroStrategy lens | Modern-stack lens |
| --- | --- | --- |
| What is an entity? | Attributes, forms, lookup tables, and relationships defined business entities and drill paths. | Dimensions, entities, joins, and explores define how data can be combined. |
| What is being measured? | Facts and metrics separated source values from business calculations. | Measures and metrics provide reusable definitions, sometimes shared across tools. |
| At what grain? | Level metrics and dimensionality controlled aggregation independently of a report's display grain. | Some semantic layers, BI expressions, and SQL patterns cover this; complex nested aggregation still needs careful modeling. |
| Compared with when? | Transformations expressed comparisons such as prior year or month to date. | Time dimensions, offsets, and rolling-window definitions handle common cases. |
| Under which conditions? | Filters, prompts, custom groups, and consolidations changed the scope of a question. | Parameters, saved filters, semantic queries, and BI controls divide that responsibility. |

The hardest cases are where a metric changes meaning with its grain, filter context, or join path. A tool can expose a metric name while still leaving those rules ambiguous. This is why I evaluate semantic layers by the questions they can express and explain, not by the number of object types they list.

## 4. Query planning

Between a business question and a result is a planner. MicroStrategy's SQL Engine made that translation visible through join selection, fact selection, multi-pass SQL, and database-specific tuning. The same responsibility now appears in semantic compilers, BI query generators, transformation systems, and database optimizers.

| Planning concern | Why it matters |
| --- | --- |
| Join path and grain | The planner must avoid duplication and choose relationships that preserve the intended meaning. |
| Aggregate choice | It must decide whether a summary table or materialized result can answer the request correctly. |
| Multi-stage calculation | Ratios, distinct counts, nested aggregates, and non-additive metrics may require more than one SQL pass. |
| SQL dialect and pushdown | A logical request still has to become efficient SQL for a particular engine. |
| Inspectability | People need to see the generated query and understand why it produced a result. |

This is one place where years inside MicroStrategy remain useful: I can recognize when an apparently simple semantic definition hides a difficult query-planning problem.

## 5. Execution and acceleration

Analytics needs more than a correct SQL statement. It also needs to serve repeated, interactive questions at acceptable cost and latency. MicroStrategy combined warehouse queries with in-memory processing, Intelligent Cubes, caches, and MultiSource. Modern systems spread those jobs across several execution layers.

| Workload need | MicroStrategy lens | Modern-stack lens |
| --- | --- | --- |
| Post-query calculation | The Analytical Engine handled operations such as subtotals, ranking, and cross-tabs. | More calculation is pushed into SQL engines; some remains in client or application runtimes. |
| Reuse of precomputed results | Intelligent Cubes and Dynamic Sourcing accelerated eligible reports. | Materialized views, aggregate awareness, pre-aggregations, and query rewrite reuse prepared results. |
| Cross-source access | MultiSource could combine data from different systems. | Federated query engines connect sources, while a semantic layer still has to define what their combination means. |
| High-concurrency serving | Cubes and caches supported repeated analytical access. | Specialized analytical stores, caches, and serving engines support low-latency workloads. |

The design decision is not simply “warehouse or cube.” It is **which work to compute on demand, which work to precompute, and how to keep the two answers consistent**.

## 6. Platform operations

A mature analytics system must enforce access, manage workloads, observe usage, and test changes. MicroStrategy offered many of these controls within its own server and metadata boundary. The modern stack often places them closer to the data platform so that more consumers share the same rules.

| Operational concern | MicroStrategy lens | Modern-stack lens |
| --- | --- | --- |
| Access control | Roles, ACLs, and security filters governed BI objects and results. | Identity, catalog policies, row filters, and column masks can apply across multiple consumers. |
| Workload management | Server clustering and governors controlled analytics demand. | Compute platforms and query engines manage concurrency, resource groups, and cost. |
| Usage and health | Platform analytics exposed adoption and performance. | Query history, billing data, logs, lineage, and BI usage data have to be assembled into one operational picture. |
| Regression testing | Report comparison helped catch changes in output. | Data tests, data diffs, semantic validation, and dashboard checks cover different parts of the risk. |

Moving a policy closer to the data can broaden its coverage. It also creates a coordination problem: business definitions, access rules, and deployment practices must agree across tools.

## 7. Consumption

Reports and dashboards were once the primary destination for the semantic model. They remain important, but the same definitions now need to reach applications, APIs, alerts, and AI-assisted interfaces.

| Consumer | MicroStrategy lens | Modern-stack lens |
| --- | --- | --- |
| Human analysis | Reports, documents, dossiers, and mobile experiences | BI dashboards, notebooks, self-service analysis, and embedded views |
| Scheduled action | Subscriptions, bursting, and distribution | Scheduled delivery, alerts, and operational workflows |
| Application access | REST APIs and embedding | Semantic APIs, SQL endpoints, and embedded analytics |
| Natural-language access | NLQ and contextual experiences | AI assistants that need governed metrics, clear context, and explainable queries |

The interface changes, but the trust question does not: can a consumer tell what a number means, where it came from, and whether it is appropriate for the decision at hand?

## How I use this map

My MicroStrategy experience gives me a deep reference point for semantic modeling, query generation, acceleration, security, and enterprise-scale change. My modern-stack experience broadens the view to storage formats, transformation code, catalogs, independent compute engines, APIs, and AI consumers.

I use the map to ask three questions when evaluating an architecture:

1. **Who owns each definition?** Find the system of record for data structure, business meaning, policy, and presentation.
2. **Where does each computation run?** Follow a request from user intent through planning, execution, caching, and delivery.
3. **What happens when something changes?** Trace the effect of a changed source, metric, policy, or workload across the whole path.

The modern stack offers more choices and more open boundaries. Those choices are valuable only when the connections between layers remain understandable. That is the through-line from my years with MicroStrategy to the systems I work with now.
