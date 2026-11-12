"use client"
import { useQuery } from "@tanstack/react-query"
import { appConfQueryOptions, type AdminAppConfQueryKey } from "../../../query/admin/app-conf"
import type { AppConf } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { useAdminClient } from "../../use-acs-config"

export const useAppConf = <TData = AppConf>(
  parameters: QueryParameter<AppConf, Error, TData, AdminAppConfQueryKey> = {},
) => {
  const client = useAdminClient()
  return useQuery({
    ...appConfQueryOptions(client),
    ...parameters.query,
  })
}
