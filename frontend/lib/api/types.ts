import type { components } from "@/lib/api/schema"

type Schemas = components["schemas"]

export type Repository = Schemas["RepositoryResponse"]
export type RepositoryCreate = Schemas["RepositoryCreate"]
export type RepositoryUpdate = Schemas["RepositoryUpdate"]
export type SyncJob = Schemas["SyncJobResponse"]
export type SearchResult = Schemas["SearchResult"]
export type SyncJobStatus = SyncJob["status"]
