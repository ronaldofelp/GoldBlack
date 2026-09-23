# Infra GoldBlack Coffee (OCI) — Terraform

Provisiona o "básico" da nova infra na **sua** conta OCI, como código:

- Rede: VCN + subnet pública + internet gateway + security list (abre **22 / 80 / 443**)
- Compute: 1 instância **ARM Ampere A1** (Ubuntu 22.04) — Always Free
- Banco: 1 **Autonomous Database** (ATP) — Always Free

Nada aqui é aplicado sozinho: você revisa (**Plan**) e aprova (**Apply**).

---

## Caminho recomendado: OCI Resource Manager (Terraform gerenciado, sem instalar nada)

1. Gere um par de chaves SSH se ainda não tiver (só a **pública** entra aqui):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/goldblack_oci
   # a pública é ~/.ssh/goldblack_oci.pub — a PRIVADA nunca sai da sua máquina
   ```
2. Baixe esta pasta `infra/` como **.zip** (ou conecte o repositório no passo 3).
3. Console OCI → **Developer Services → Resource Manager → Stacks → Create Stack**.
   - Origem: **My Configuration** → suba o `.zip` (ou **Source Code Control** → aponte o repo/branch `Dalaqua`, pasta `infra`).
4. Na tela de **variáveis**, preencha:
   - `compartment_ocid` — o compartment onde criar (pode ser o root).
   - `ssh_public_key` — cole o conteúdo do arquivo `.pub`.
   - `adb_admin_password` — senha do ADB (12-30 chars, maiúscula + minúscula + número; sem aspas duplas nem a palavra "admin").
   - `tenancy_ocid` e `region` já vêm preenchidos pela sessão.
5. **Plan** (revisa o que será criado) → **Apply**.
6. No fim, veja os **Outputs**: `instance_public_ip` (IP da máquina) e `autonomous_db_connection_strings`.

## Alternativa: OCI Cloud Shell (terminal no navegador, Terraform já instalado)

```bash
# no Cloud Shell do console:
git clone <repo> && cd GoldBlack/infra
cp terraform.tfvars.example terraform.tfvars   # edite e preencha
terraform init
terraform plan
terraform apply
```

---

## ⚠️ "Out of host capacity" no ARM A1

É a Oracle sem estoque de A1 gratuito na Availability Domain/região naquele momento — **não é erro de configuração**. O que fazer:
- Mude `ad_number` (1 → 2 → 3) e rode o Plan/Apply de novo.
- Se persistir, tente outra região ou repita mais tarde.
- Por isso vale rodar isto **cedo**: garante a capacidade antes da entrega.

## Segurança

- Só a chave **pública** SSH entra no Terraform. A privada nunca é versionada (o `.gitignore` cobre `id_*`, `*.key`, `*.pem`).
- `terraform.tfvars` (com a senha do ADB) e o `*.tfstate` estão no `.gitignore`. No Resource Manager o state fica gerenciado na OCI, não local.
- SSH está aberto pra `0.0.0.0/0` por simplicidade — dá pra restringir ao seu IP depois via `ingress_tcp_ports` / regra dedicada.
