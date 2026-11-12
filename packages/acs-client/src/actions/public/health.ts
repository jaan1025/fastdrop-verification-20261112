import type { AcsClient } from "../../transport"
import type { HealthResponse } from "../../model"

export const getHealth = (client: AcsClient) => client.request<HealthResponse>("/health")
