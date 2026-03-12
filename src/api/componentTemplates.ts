import axios from "axios"

import { fetchAllPages } from "@/utils/pagination"


export interface ComponentNodeTemplate {
    id: number
    name: string
    node_data: Record<string, any>
    component_code: string
    component_version: string
    created_by: number
    created_at: string
    updated_at: string
}

export interface UpdateComponentTemplatePayload {
    name?: string
    node_data?: Record<string, any>
}

export const listTemplates = async (): Promise<ComponentNodeTemplate[]> => {
    return fetchAllPages<ComponentNodeTemplate>("/api/components/templates/")
}

export const createTemplate = async (
    name: string,
    nodeData: Record<string, any>
): Promise<ComponentNodeTemplate> => {
    const resp = await axios.post("/api/components/templates/", {
        name,
        node_data: nodeData,
    })
    return resp.data
}

export const updateTemplate = async (
    id: number,
    payload: UpdateComponentTemplatePayload
): Promise<ComponentNodeTemplate> => {
    const resp = await axios.patch(`/api/components/templates/${id}/`, payload)
    return resp.data
}

export const deleteTemplate = async (id: number): Promise<void> => {
    await axios.delete(`/api/components/templates/${id}/`)
}
