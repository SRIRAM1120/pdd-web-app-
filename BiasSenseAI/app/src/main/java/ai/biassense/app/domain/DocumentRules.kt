package ai.biassense.app.domain

object DocumentRules {
    const val MAX_BYTES = 25L * 1024L * 1024L
    val extensions = setOf("pdf","jpg","jpeg","png","webp","txt","csv","xls","xlsx","doc","docx")
    fun validate(name: String, size: Long): String? = when {
        size <= 0 -> "The selected file is empty."
        size > MAX_BYTES -> "Select a file smaller than 25 MB."
        name.substringAfterLast('.', "").lowercase() !in extensions -> "This file type is not supported."
        else -> null
    }
}
