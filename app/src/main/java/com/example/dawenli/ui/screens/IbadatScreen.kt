package com.example.dawenli.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.dawenli.data.model.WorshipDefinitionEntity
import com.example.dawenli.data.model.WorshipLogEntity
import com.example.dawenli.ui.DawenliViewModel
import com.example.dawenli.ui.theme.GoldSecondaryLight
import com.example.dawenli.ui.theme.GreenSuccess

@Composable
fun IbadatScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val worshipDefinitions by viewModel.worshipDefinitions.collectAsState()
    val todayLogs by viewModel.todayWorshipLogs.collectAsState()

    val salahList = worshipDefinitions.filter { it.category == "salah" }
    val adhkarList = worshipDefinitions.filter { it.category == "adhkar" }
    val quranAndOthers = worshipDefinitions.filter { it.category != "salah" && it.category != "adhkar" }

    val completedCount = todayLogs.count { it.isCompleted }
    val totalCount = worshipDefinitions.size
    val compliancePercent = if (totalCount > 0) Math.round((completedCount.toFloat() / totalCount) * 100) else 0

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("ibadat_screen"),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Ibadat Banner / Compliance Progress
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "📖 منظومة العبادات والأوراد",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "تثبيت الصلوات في وقتها، أوراد القرآن، والأذكار اليومية",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = MaterialTheme.colorScheme.primary
                        ) {
                            Text(
                                text = "$compliancePercent%",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    LinearProgressIndicator(
                        progress = { compliancePercent / 100f },
                        modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                        color = MaterialTheme.colorScheme.primary,
                        trackColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                }
            }
        }

        // 2. Quran Khatma Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = "متابعة الختمة القرآنية", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(text = "الورد المقترح: ربعان من الحزب يوميًا (حوالي 5 صفحات)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = GoldSecondaryLight.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = "الجزء الثاني",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = GoldSecondaryLight,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }

        // 3. Fard Prayers (الصلوات المفروضة)
        item {
            Text(
                text = "الصلوات الخمس المفروضة",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
        items(salahList) { item ->
            val log = todayLogs.find { it.worshipId == item.id }
            WorshipItemRow(
                item = item,
                isCompleted = log?.isCompleted ?: false,
                onToggle = { viewModel.toggleWorshipToday(item.id, performance = "jamaah") }
            )
        }

        // 4. Adhkar (الأذكار)
        item {
            Text(
                text = "الأذكار وحصن المسلم",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
        items(adhkarList) { item ->
            val log = todayLogs.find { it.worshipId == item.id }
            WorshipItemRow(
                item = item,
                isCompleted = log?.isCompleted ?: false,
                onToggle = { viewModel.toggleWorshipToday(item.id) }
            )
        }

        // 5. Quran & Qiyam
        item {
            Text(
                text = "النوافل وورد القرآن وقيام الليل",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
        items(quranAndOthers) { item ->
            val log = todayLogs.find { it.worshipId == item.id }
            WorshipItemRow(
                item = item,
                isCompleted = log?.isCompleted ?: false,
                onToggle = { viewModel.toggleWorshipToday(item.id) }
            )
        }
    }
}

@Composable
fun WorshipItemRow(
    item: WorshipDefinitionEntity,
    isCompleted: Boolean,
    onToggle: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isCompleted) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f)
            else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Checkbox(
                    checked = isCompleted,
                    onCheckedChange = { onToggle() },
                    modifier = Modifier.testTag("worship_check_${item.id}")
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "التوقيت: ${item.timeOfDay}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            if (isCompleted) {
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = GreenSuccess.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = "تم بحمد الله",
                        style = MaterialTheme.typography.labelSmall,
                        color = GreenSuccess,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                }
            }
        }
    }
}
