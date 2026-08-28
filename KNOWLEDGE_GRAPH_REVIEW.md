# Data and AI knowledge graph review

Reviewed: 2026-08-26  
Graph version: 0.2

## Verdict

The seven-layer spine is a strong and defensible way to navigate the field. It moves cleanly from substrate to human experience, and the separate cross-cutting compass prevents governance, security, quality, and operating practices from being duplicated in every branch.

The graph is now structurally valid: 274 unique topic records, 51 sub-domains, 9 cross-cutting concerns, 36 typed edges, no malformed topic maps, and no edges pointing at missing nodes.

This is an editorial taxonomy, not a universal ontology. A topic's parent is its best navigational home; it does not imply that the topic applies only within that layer.

## Corrections made

1. **Repaired 22 malformed YAML topic records.** Unquoted commas inside flow-style mappings had silently split names such as `GPUs, TPUs and custom accelerators` into extra keys. All affected names are now quoted and serialize correctly.
2. **Repaired three broken edges.** `feature-engineering`, `classical-ml`, and `model-endpoints` were sub-domain IDs used where the edge schema requires topic IDs. They now point between concrete topics.
3. **Corrected several relationship semantics.** CDC no longer claims that log-based capture inherently requires a broker; data classification now enables retention policy; drift detection is modeled as part of monitoring; and the adaptation decision framework uses a prerequisite relationship rather than claiming to be an alternative to a retrieval pipeline.
4. **Clarified delivery semantics.** The topic is now `Delivery and processing semantics`. “Exactly once” is contextual: Kafka documents stronger guarantees within transactional Kafka workflows, while external sinks require cooperation or coordinated state. See the [Apache Kafka design documentation](https://kafka.apache.org/42/design/design/).
5. **Separated cost from reliability.** These are different decision systems. Cost management now covers unit economics, pricing, right-sizing, and anomaly detection. Reliability and resilience covers SLOs, error budgets, failure domains, fault tolerance, scaling, and disaster recovery. This aligns with the way [Google SRE defines SLOs and error budgets](https://sre.google/sre-book/service-level-objectives/).
6. **Corrected a storage category error.** Block, file, and object are access interfaces rather than physical media, so the topic is now `Block, file and object storage interfaces`.
7. **Broadened AI application security.** The topic now covers prompt injection, unsafe agency, and model attacks rather than only prompt injection and extraction. The framing follows the broader risk surface in the current [OWASP GenAI security work](https://genai.owasp.org/initiatives/top-10-for-llm-and-genai/).
8. **Aligned the concern schema with the data.** Reliability, engineering practice, and operating model are now declared facet values rather than undocumented exceptions.
9. **Made the grouping rule truthful.** The graph consistently uses four-topic groups, so the rule now says a parent aims for 4–9 children instead of claiming a hard 5–9 invariant.

## Areas that are well modeled

- Open table formats correctly group snapshots, manifests, atomic table state, schema and partition evolution, maintenance, and time travel. These match the core model in the [Apache Iceberg specification](https://iceberg.apache.org/spec/?h=snapshot).
- HNSW and IVF belong under vector index structures rather than being treated as database products. HNSW originates as an approximate nearest-neighbor graph algorithm; see the [HNSW paper](https://arxiv.org/abs/1603.09320).
- Inference systems and model endpoints are usefully separated: the former concerns runtime efficiency and scheduling, while the latter concerns how inference is exposed and operated.
- Feature engineering, feature stores, and training data are separated cleanly enough to teach leakage, point-in-time correctness, and training-serving consistency without collapsing them into “MLOps.”
- Responsible AI remains cross-cutting. This is consistent with the lifecycle framing in the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), which spans design, development, deployment, use, and evaluation.

## Deliberate limitations and next review pass

- **Edge coverage is sparse by design.** Only a small fraction of topics have authored relationships. Add edges by relation type across the whole graph to avoid dense, inconsistent pockets.
- **Facets identify a primary context.** A single role or lifecycle stage is useful for filtering but should not be interpreted as exclusivity. If the atlas later becomes a curriculum planner, convert these facets to arrays.
- **Tools are intentionally absent from the spine.** Before adding `implemented_by` edges, define a separate external-entity collection for products and projects so tool names are not mistaken for learnable concepts.
- **Maturity is time-sensitive.** Revisit `emerging` and `evolving` labels on a regular cadence, especially retrieval, agents, conversational interfaces, semantic layers, and model serving.
- **Regulation varies by jurisdiction.** `AI regulation and model documentation` is appropriately broad for a global atlas; jurisdiction-specific requirements belong in guides rather than the spine.

## Ongoing validation contract

Every review should confirm:

- topic IDs are unique;
- topic records contain exactly `id` and `name` unless the schema is intentionally extended;
- every edge endpoint resolves to a topic or declared external entity;
- edge types exist in the schema and their direction reads naturally as a sentence;
- concern IDs appear in the concern facet vocabulary;
- each group stays within the stated 4–9 topic guideline;
- maturity labels and AI security coverage have a dated editorial review.
