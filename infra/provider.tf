terraform {
  required_version = ">= 1.3"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0"
    }
  }
}

# Em OCI Resource Manager / Cloud Shell a autenticação é injetada pela sessão
# logada — não é preciso configurar chave de API nem colocar segredo aqui.
# A única coisa que passamos é a região (o Resource Manager pré-preenche).
provider "oci" {
  region = var.region
}
