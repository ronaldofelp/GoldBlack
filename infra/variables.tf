# ─────────────────────────────────────────────────────────────────────────────
# Identidade / região
# No OCI Resource Manager, `tenancy_ocid` e `region` são preenchidos
# automaticamente pela sessão. `compartment_ocid` você escolhe no formulário.
# ─────────────────────────────────────────────────────────────────────────────
variable "tenancy_ocid" {
  type        = string
  description = "OCID da tenancy (Resource Manager preenche sozinho)."
}

variable "compartment_ocid" {
  type        = string
  description = "OCID do compartment onde os recursos serão criados."
}

variable "region" {
  type        = string
  description = "Região OCI (ex.: sa-saopaulo-1). Resource Manager preenche sozinho."
}

# ─────────────────────────────────────────────────────────────────────────────
# Compute (instância da aplicação)
# Default = x86 pago (E4.Flex) para fugir da falta de capacidade do A1 grátis.
# Para voltar ao ARM Always Free, troque instance_shape para "VM.Standard.A1.Flex".
# ─────────────────────────────────────────────────────────────────────────────
variable "instance_shape" {
  type        = string
  default     = "VM.Standard.E5.Flex"
  description = "Shape da instância. E4.Flex/E5.Flex = x86 flex pago (consome créditos, mas tem capacidade). A1.Flex = ARM Ampere Always Free (sujeito a 'Out of host capacity')."
}

variable "ad_number" {
  type        = number
  default     = 1
  description = "Availability Domain a usar (1, 2 ou 3). Em região de 1 AD só existe o 1."
}

variable "instance_display_name" {
  type    = string
  default = "goldblack-app"
}

variable "instance_ocpus" {
  type        = number
  default     = 2
  description = "OCPUs da instância flex. No E4/E5.Flex cada OCPU aceita de 1 a 64 GB de RAM."
}

variable "instance_memory_in_gbs" {
  type        = number
  default     = 12
  description = "Memória (GB). Precisa respeitar a razão do shape (E4/E5.Flex: 1–64 GB por OCPU)."
}

variable "boot_volume_size_in_gbs" {
  type    = number
  default = 50
}

variable "ssh_public_key" {
  type        = string
  description = "Conteúdo da sua CHAVE PÚBLICA SSH (id_ed25519.pub / id_rsa.pub). NUNCA a privada."
}

variable "ingress_tcp_ports" {
  type        = list(number)
  default     = [22, 80, 443]
  description = "Portas TCP liberadas de entrada. App roda atrás do Caddy em 80/443; 22 para SSH."
}

# ─────────────────────────────────────────────────────────────────────────────
# Autonomous Database (Always Free)
# ─────────────────────────────────────────────────────────────────────────────
variable "adb_db_name" {
  type        = string
  default     = "goldblackdb"
  description = "Nome do banco (letras/números, começa com letra, até 14 chars)."
}

variable "adb_display_name" {
  type    = string
  default = "goldblack-adb"
}

variable "adb_admin_password" {
  type        = string
  sensitive   = true
  description = "Senha do usuário ADMIN do Autonomous DB. 12-30 chars, com maiúscula, minúscula e número; sem aspas duplas nem a palavra 'admin'."
}
