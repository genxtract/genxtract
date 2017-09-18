# Combinator

Base class for all of the combinators. All combinators should implement the following methods:

* `dataCallback(data)` - Accept and process data from the extractor. Data objects have the format `{type, data}`.
* `finalizeCallback()` - Do any post processing; called after extraction ends and before `serializeCallback()`.
* `serializeCallback()` - Serialize and return the data.

See the gedcomx combinator for an example.
