// composables/useGqlSubscription.ts
import type { Client } from 'graphql-ws'

type ExecResult<T> = { data?: T; errors?: readonly any[] }

export function useGqlSubscription<TData = unknown, TVars extends Record<string, any> = Record<string, any>>(
    opts: { query: string; variables?: TVars; immediate?: boolean } )
{
    const { $gqlWs } = useNuxtApp() as unknown as { $gqlWs: Client | null }

    const data = ref<TData | null>(null)
    const error = ref<unknown>(null)
    const connected = ref(false)
    let dispose: (() => void) | null = null

    const execute = (vars?: TVars) => {
        if (!$gqlWs) return
        // cleanup previous
        dispose?.()
        connected.value = true

        dispose = $gqlWs.subscribe<ExecResult<TData>>(
            { query: opts.query, variables: vars ?? opts.variables },
            {
                next: (res) => {
                    if (res?.data) data.value = res.data as TData
                    if (res?.errors?.length) error.value = res.errors
                },
                error: (err) => { error.value = err },
                complete: () => { /* optional */ },
            }
        )
    }

    const stop = () => { dispose?.(); dispose = null; connected.value = false }

    onBeforeUnmount(stop)

    if (opts.immediate) onMounted(() => execute())

    return { data, error, connected, execute, stop }
}