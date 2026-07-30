package ai.biassense.app.domain

object MetricExtractor {
    private val line = Regex("""(?im)^([A-Za-z][A-Za-z ()/%-]{1,40})\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*([A-Za-z/%µ]+)?(?:\s+([<>]?[=\d.\-–]+\s*[A-Za-z/%µ]*))?""")
    fun extract(text: String): List<LabMetric> = line.findAll(text).map { match ->
        val value = match.groupValues[2].toDouble()
        val classification = when { value < 80 -> "Normal"; value < 100 -> "Good"; else -> "Anomaly" }
        LabMetric(match.groupValues[1].trim(), value, match.groupValues[3], match.groupValues[4],
            "", classification, classification, "${match.groupValues[1].trim()}: $value")
    }.distinctBy { it.attribute.lowercase() }.toList()
}
