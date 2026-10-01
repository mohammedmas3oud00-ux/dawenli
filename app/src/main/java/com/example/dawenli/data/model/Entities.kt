package com.example.dawenli.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pillars")
data class PillarEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val pillarGroup: String, // Growth, Vitality, Impact, Wealth, Community, Spirituality
    val purpose: String,
    val priority: Int = 1,
    val showOnHome: Boolean = true,
    val status: String = "active", // active, archived
    val progress: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "visions")
data class VisionEntity(
    @PrimaryKey val id: String,
    val pillarId: String,
    val title: String,
    val description: String,
    val timeframe: String = "2026-2030",
    val status: String = "active",
    val progress: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "value_goals")
data class ValueGoalEntity(
    @PrimaryKey val id: String,
    val pillarId: String,
    val visionId: String? = null,
    val title: String,
    val description: String,
    val status: String = "in_progress", // not_started, in_progress, completed
    val targetDate: String? = null,
    val progress: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "projects")
data class ProjectEntity(
    @PrimaryKey val id: String,
    val goalId: String,
    val title: String,
    val description: String,
    val status: String = "in_progress", // planned, in_progress, completed, on_hold
    val progress: Int = 0,
    val startDate: String = "",
    val dueDate: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val title: String,
    val description: String = "",
    val status: String = "todo", // todo, in_progress, done
    val priority: String = "medium", // low, medium, high
    val dueDate: String? = null,
    val completedAt: Long? = null,
    val estimatedHours: Double? = null,
    val energyLevel: String = "medium", // high, medium, low
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "habits")
data class HabitEntity(
    @PrimaryKey val id: String,
    val pillarId: String,
    val title: String,
    val description: String = "",
    val frequency: String = "daily", // daily, weekdays, custom
    val targetDaysPerWeek: Int = 7,
    val timeOfDay: String = "anytime", // morning, afternoon, evening, anytime
    val currentStreak: Int = 0,
    val longestStreak: Int = 0,
    val completedDatesCsv: String = "", // Comma-separated YYYY-MM-DD
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "inbox_items")
data class InboxEntity(
    @PrimaryKey val id: String,
    val title: String,
    val content: String = "",
    val sourceType: String = "idea", // idea, task_seed, reference, question, link
    val status: String = "inbox", // inbox, processed, archived
    val convertedTo: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "worship_definitions")
data class WorshipDefinitionEntity(
    @PrimaryKey val id: String,
    val pillarId: String,
    val title: String,
    val category: String, // salah, sunnah_rawatib, adhkar, quran_wird, qiyam, fasting, sadaqah
    val trackingType: String = "checkbox", // checkbox, counter, multi_option, pages
    val timeOfDay: String = "anytime", // fajr, dhuhr, asr, maghrib, isha, morning, evening, night
    val targetCount: Int? = null,
    val targetPages: Double? = null,
    val isActive: Boolean = true,
    val sortOrder: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "worship_logs")
data class WorshipLogEntity(
    @PrimaryKey val id: String,
    val worshipId: String,
    val date: String, // YYYY-MM-DD
    val isCompleted: Boolean = false,
    val count: Int? = null,
    val pagesRead: Double? = null,
    val performance: String? = null, // ada, qada, missed
    val congregation: String? = null, // jamaah, fard
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "system_reviews")
data class SystemReviewEntity(
    @PrimaryKey val id: String,
    val frequency: String = "weekly", // daily, weekly, monthly
    val date: String,
    val title: String,
    val rating: Int = 8,
    val wins: String = "",
    val challenges: String = "",
    val lessons: String = "",
    val nextCommitments: String = "",
    val systemHealthScore: Int = 85,
    val smartSummary: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "focus_sessions")
data class FocusSessionEntity(
    @PrimaryKey val id: String,
    val taskId: String? = null,
    val taskTitle: String = "",
    val mode: String = "pomodoro", // pomodoro, flowtime
    val durationSeconds: Int = 1500,
    val date: String,
    val distractionsCount: Int = 0,
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "journals")
data class JournalEntryEntity(
    @PrimaryKey val id: String,
    val title: String,
    val content: String,
    val entryDate: String,
    val mood: String = "good", // great, good, neutral, difficult
    val tagsCsv: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "time_blocks")
data class TimeBlockEntity(
    @PrimaryKey val id: String,
    val date: String, // YYYY-MM-DD
    val startTime: String, // "09:00"
    val endTime: String, // "10:30"
    val title: String,
    val category: String = "deep_work", // deep_work, shallow_work, meeting, health_habit, learning, rest, worship
    val isCompleted: Boolean = false,
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "vault_items")
data class VaultItemEntity(
    @PrimaryKey val id: String,
    val pillarId: String,
    val title: String,
    val vaultType: String = "books", // notes, books, courses, templates
    val summary: String = "",
    val content: String = "",
    val author: String = "",
    val rating: Int = 5,
    val status: String = "reading", // reading, completed, someday
    val totalUnits: Int = 100, // pages or lessons
    val completedUnits: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)

