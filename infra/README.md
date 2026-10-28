# infra/ : PLANNED reference manifests

Status: **PLANNED. Not applied, not tested, not used by `docker-compose.yml`.**

These files describe how the same isolation model would be expressed on Kubernetes:

* `k8s/namespaces/` per-tenant namespaces
* `policies/network/` default-deny plus gateway-only egress NetworkPolicies
* `runtime/gvisor/` a `RuntimeClass` for gVisor (`runsc`), a pod security context, and a seccomp profile

They were never deployed on a cluster during this project, so nothing in the console or README claims gVisor, Cilium, or Kubernetes enforcement as VERIFIED. What is verified is the Docker Compose stack, by `pnpm demo`.

Before using them: check the image names (`bayora/red-runner`, etc. are placeholders that are not built by this repo), the gateway port (8443 here vs 4000 in compose), and the vLLM target label, which differs from the Ollama target used in compose.
