import type { UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { getHealth } from "../../actions/public/health"
import { acsKeys } from "../keys"
import type { HealthResponse } from "../../model"

export type HealthQueryKey = ReturnType<typeof acsKeys.public.health>

export const healthQueryOptions = (client: AcsClient) =>
  ({
    queryKey: acsKeys.public.health(),
    queryFn: () => getHealth(client),
  }) satisfies UseQueryOptions<HealthResponse, Error, HealthResponse, HealthQueryKey>
