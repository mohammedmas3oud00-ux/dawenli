package com.example.dawenli.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import com.example.dawenli.ui.DawenliViewModel

@Composable
fun FocusSessionScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val isRunning by viewModel.isFocusTimerRunning.collectAsState()
    val secondsRemaining by viewModel.focusSecondsRemaining.collectAsState()
    val totalSeconds by viewModel.focusTotalSeconds.collectAsState()
    val selectedTask by viewModel.selectedFocusTask.collectAsState()
    val distractionCount by viewModel.focusDistractionCount.collectAsState()
    val sessions by viewModel.focusSessions.collectAsState()

    val minutes = secondsRemaining / 60
    val seconds = secondsRemaining % 60
    val timeFormatted = String.format("%02d:%02d", minutes, seconds)
    val progress = if (totalSeconds > 0) (totalSeconds - secondsRemaining).toFloat() / totalSeconds else 0f

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("focus_session_screen"),
        contentPadding = PaddingValues(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "⏱️ جلسة التركيز العميق",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = selectedTask?.title ?: "بدون مهمة محددة — تركيز حر",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold
                    )

                    Spacer(modifier = Modifier.height(28.dp))

                    // Circular / Big Display
                    Box(
                        modifier = Modifier
                            .size(200.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = timeFormatted,
                                fontSize = 44.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = if (isRunning) "قيد التركيز..." else "متوقف مؤقتًا",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Controls
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (!isRunning) {
                            Button(
                                onClick = {
                                    if (secondsRemaining == 0) viewModel.startFocusSession(selectedTask)
                                    else viewModel.resumeFocusTimer()
                                },
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.testTag("start_timer_btn")
                            ) {
                                Icon(imageVector = Icons.Default.PlayArrow, contentDescription = "Start")
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("بدء التركيز")
                            }
                        } else {
                            FilledTonalButton(
                                onClick = { viewModel.pauseFocusTimer() },
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.testTag("pause_timer_btn")
                            ) {
                                Icon(imageVector = Icons.Default.Pause, contentDescription = "Pause")
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("إيقاف مؤقت")
                            }
                        }

                        OutlinedButton(
                            onClick = { viewModel.completeFocusSession() },
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(imageVector = Icons.Default.DoneAll, contentDescription = "Finish")
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("إنهاء الجلسة")
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Preset buttons
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = totalSeconds == 25 * 60,
                            onClick = { viewModel.startFocusSession(selectedTask, 25) },
                            label = { Text("25 دقيقة (بومودورو)") }
                        )
                        FilterChip(
                            selected = totalSeconds == 50 * 60,
                            onClick = { viewModel.startFocusSession(selectedTask, 50) },
                            label = { Text("50 دقيقة (تركيز عميق)") }
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Distraction logger
                    FilledTonalButton(
                        onClick = { viewModel.recordDistraction() },
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f),
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(imageVector = Icons.Default.NotificationsOff, contentDescription = "Distraction")
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("تسجيل تشتت ($distractionCount)")
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "سجل جلسات اليوم السابقة",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${sessions.size} جلسة",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        items(sessions) { session ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = session.taskTitle, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                        Text(text = "المدة: ${session.durationSeconds / 60} دقيقة • التشتت: ${session.distractionsCount}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text(text = "✓ مكتملة", color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
