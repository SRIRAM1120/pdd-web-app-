package ai.biassense.app.domain

data class LabMetric(
    val attribute: String = "", val value: Double = 0.0, val unit: String = "",
    val referenceRange: String = "", val sourceStatus: String = "", val finalStatus: String = "",
    val classification: String = "", val savedAnalysisText: String = ""
)
data class AnalysisRecord(
    val id: String = "", val userId: String = "", val fileName: String = "", val reportType: String = "",
    val analysisDate: Long = 0, val createdAt: Long = 0, val metrics: List<LabMetric> = emptyList(),
    val findings: List<String> = emptyList(), val recommendations: List<String> = emptyList(),
    val summary: String = "", val analysisError: String? = null, val status: String = "Completed"
)
data class UserProfile(
    val fullName: String = "", val role: String = "", val organization: String = "",
    val country: String = "", val email: String = "", val emailAlerts: Boolean = false
)
