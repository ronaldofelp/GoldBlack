output "instance_public_ip" {
  description = "IP público da instância ARM — aponte o DNS pra cá."
  value       = oci_core_instance.app.public_ip
}

output "instance_availability_domain" {
  value = oci_core_instance.app.availability_domain
}

output "autonomous_db_ocid" {
  value = oci_database_autonomous_database.adb.id
}

output "autonomous_db_connection_strings" {
  description = "Strings de conexão do ADB (sensível — use para configurar o backend)."
  value       = oci_database_autonomous_database.adb.connection_strings
  sensitive   = true
}
