package ai.biassense.app
import ai.biassense.app.domain.DocumentRules
import ai.biassense.app.domain.MetricExtractor
import org.junit.Assert.*
import org.junit.Test
class DomainTests {
    @Test fun rejectsOversizeAndUnsupportedDocuments() {
        assertNotNull(DocumentRules.validate("scan.exe", 10))
        assertNotNull(DocumentRules.validate("scan.pdf", DocumentRules.MAX_BYTES + 1))
        assertNull(DocumentRules.validate("scan.pdf", 100))
    }
    @Test fun classifiesMetricsByLocalRules() {
        val metrics = MetricExtractor.extract("HDL 55 mg/dL\nLDL 95 mg/dL\nCholesterol 180 mg/dL")
        assertEquals(listOf("Normal","Good","Anomaly"), metrics.map { it.classification })
    }
}
