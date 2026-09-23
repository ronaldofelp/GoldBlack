# Autonomous Database em Always Free (is_free_tier = true).
# O Always Free usa o modelo de compute "ECPU": o campo legado cpu_core_count
# volta da API como 0, então o Terraform tentaria "corrigir" pra 1 num update e
# o Always Free recusa (403 - feature not supported). Por isso ignoramos a deriva
# de cpu_core_count/data_storage abaixo. db_workload="OLTP" = ATP (perfil da app).
resource "oci_database_autonomous_database" "adb" {
  compartment_id = var.compartment_ocid
  db_name        = var.adb_db_name
  display_name   = var.adb_display_name
  admin_password = var.adb_admin_password
  db_workload    = "OLTP"
  is_free_tier   = true

  # Permite mTLS (wallet) — é como a aplicação vai se conectar.
  is_mtls_connection_required = true

  lifecycle {
    # Always Free fixa o compute/armazenamento — não deixe o Terraform tentar
    # reconciliar esses campos (evita o update que dá 403 no Always Free).
    ignore_changes = [cpu_core_count, compute_count, compute_model, data_storage_size_in_tbs, data_storage_size_in_gb]
  }
}
