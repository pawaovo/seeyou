import { Database } from './types'

export type Tables = Database['public']['Tables']
export type Event = Tables['events']['Row']
export type EventInsert = Tables['events']['Insert']
export type EventUpdate = Tables['events']['Update']
export type Response = Tables['responses']['Row']
export type ResponseInsert = Tables['responses']['Insert']
export type ResponseUpdate = Tables['responses']['Update']
