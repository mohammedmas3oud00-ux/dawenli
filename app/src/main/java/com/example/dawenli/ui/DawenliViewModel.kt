package com.example.dawenli.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.dawenli.data.local.DawenliDatabase
import com.example.dawenli.data.model.*
import com.example.dawenli.data.repository.DawenliRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

enum class AppTab(val title: String) {
    DASHBOARD("الرئيسية"),
    HIERARCHY("المنظومة الهرمية"),
    IBADAT("العبادات"),
    TASKS("المهام"),
    HABITS("العادات"),
    FOCUS("جلسة التركيز"),
    TIMEBLOCKING("الكتل الزمنية"),
    VAULTS("المخازن والمكتبة"),
    JOURNALS("اليوميات والتأمل"),
    REVIEWS("المراجعات"),
    INBOX("صندوق الوارد")
}

data class PrayerTimeItem(
    val name: String,
    val time: String,
    val isNext: Boolean = false,
    val isDone: Boolean = false
)

class DawenliViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: DawenliRepository

    val currentTab = MutableStateFlow(AppTab.DASHBOARD)

    val pillars: StateFlow<List<PillarEntity>>
    val visions: StateFlow<List<VisionEntity>>
    val goals: StateFlow<List<ValueGoalEntity>>
    val projects: StateFlow<List<ProjectEntity>>
    val tasks: StateFlow<List<TaskEntity>>
    val habits: StateFlow<List<HabitEntity>>
    val inboxItems: StateFlow<List<InboxEntity>>
    val worshipDefinitions: StateFlow<List<WorshipDefinitionEntity>>
    val reviews: StateFlow<List<SystemReviewEntity>>
    val focusSessions: StateFlow<List<FocusSessionEntity>>
    val journals: StateFlow<List<JournalEntryEntity>>
    val vaultItems: StateFlow<List<VaultItemEntity>>
    val todayTimeBlocks: StateFlow<List<TimeBlockEntity>>

    // Focus Session state
    val isFocusTimerRunning = MutableStateFlow(false)
    val focusSecondsRemaining = MutableStateFlow(25 * 60)
    val focusTotalSeconds = MutableStateFlow(25 * 60)
    val focusMode = MutableStateFlow("pomodoro") // pomodoro, flowtime
    val selectedFocusTask = MutableStateFlow<TaskEntity?>(null)
    val focusDistractionCount = MutableStateFlow(0)
    private var timerJob: Job? = null

    // Date today
    val todayDateKey: String
        get() = SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH).format(Date())

    val todayWorshipLogs: StateFlow<List<WorshipLogEntity>>

    init {
        val db = DawenliDatabase.getDatabase(application)
        repository = DawenliRepository(db.dawenliDao())

        pillars = repository.allPillars.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        visions = repository.allVisions.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        goals = repository.allGoals.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        projects = repository.allProjects.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        tasks = repository.allTasks.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        habits = repository.allHabits.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        inboxItems = repository.allInboxItems.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        worshipDefinitions = repository.allWorshipDefinitions.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        reviews = repository.allReviews.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        focusSessions = repository.allFocusSessions.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        journals = repository.allJournals.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        vaultItems = repository.allVaultItems.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        todayTimeBlocks = repository.getTimeBlocksByDate(todayDateKey).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

        todayWorshipLogs = repository.getWorshipLogsByDate(todayDateKey)
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

        viewModelScope.launch {
            repository.seedInitialDataIfEmpty()
        }
    }

    // --- PRAYER TIMES ---
    val prayerTimes: StateFlow<List<PrayerTimeItem>> = flow {
        emit(
            listOf(
                PrayerTimeItem("الفجر", "04:52", isNext = false, isDone = true),
                PrayerTimeItem("الشروق", "06:15", isNext = false, isDone = true),
                PrayerTimeItem("الظهر", "12:18", isNext = false, isDone = true),
                PrayerTimeItem("العصر", "15:42", isNext = true, isDone = false),
                PrayerTimeItem("المغرب", "18:20", isNext = false, isDone = false),
                PrayerTimeItem("العشاء", "19:40", isNext = false, isDone = false)
            )
        )
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    // --- ACTIONS ---
    fun selectTab(tab: AppTab) {
        currentTab.value = tab
    }

    fun toggleTaskStatus(task: TaskEntity) {
        viewModelScope.launch {
            val nextStatus = if (task.status == "done") "todo" else "done"
            val completedAt = if (nextStatus == "done") System.currentTimeMillis() else null
            repository.updateTask(task.copy(status = nextStatus, completedAt = completedAt))
        }
    }

    fun addTask(projectId: String, title: String, priority: String, energyLevel: String) {
        viewModelScope.launch {
            val task = TaskEntity(
                id = UUID.randomUUID().toString(),
                projectId = projectId,
                title = title,
                priority = priority,
                energyLevel = energyLevel
            )
            repository.insertTask(task)
        }
    }

    fun addProject(goalId: String, title: String, description: String) {
        viewModelScope.launch {
            val project = ProjectEntity(
                id = UUID.randomUUID().toString(),
                goalId = goalId,
                title = title,
                description = description
            )
            repository.insertProject(project)
        }
    }

    fun addGoal(pillarId: String, title: String, description: String) {
        viewModelScope.launch {
            val goal = ValueGoalEntity(
                id = UUID.randomUUID().toString(),
                pillarId = pillarId,
                title = title,
                description = description
            )
            repository.insertGoal(goal)
        }
    }

    fun addPillar(title: String, description: String, purpose: String, group: String) {
        viewModelScope.launch {
            val pillar = PillarEntity(
                id = UUID.randomUUID().toString(),
                title = title,
                description = description,
                purpose = purpose,
                pillarGroup = group,
                priority = (pillars.value.size + 1)
            )
            repository.insertPillar(pillar)
        }
    }

    fun toggleHabitToday(habit: HabitEntity) {
        viewModelScope.launch {
            repository.toggleHabitForDate(habit, todayDateKey)
        }
    }

    fun addHabit(pillarId: String, title: String, frequency: String, timeOfDay: String) {
        viewModelScope.launch {
            val habit = HabitEntity(
                id = UUID.randomUUID().toString(),
                pillarId = pillarId,
                title = title,
                frequency = frequency,
                timeOfDay = timeOfDay
            )
            daoInsertHabit(habit)
        }
    }

    private suspend fun daoInsertHabit(habit: HabitEntity) {
        DawenliDatabase.getDatabase(getApplication()).dawenliDao().insertHabit(habit)
    }

    fun toggleWorshipToday(worshipId: String, performance: String? = null) {
        viewModelScope.launch {
            val existing = todayWorshipLogs.value.find { it.worshipId == worshipId }
            val isCompleted = !(existing?.isCompleted ?: false)
            repository.logWorship(worshipId, todayDateKey, isCompleted, performance)
        }
    }

    fun addInboxItem(title: String, content: String, sourceType: String) {
        viewModelScope.launch {
            val item = InboxEntity(
                id = UUID.randomUUID().toString(),
                title = title,
                content = content,
                sourceType = sourceType
            )
            repository.insertInboxItem(item)
        }
    }

    fun convertInboxToTask(item: InboxEntity, projectId: String) {
        viewModelScope.launch {
            val task = TaskEntity(
                id = UUID.randomUUID().toString(),
                projectId = projectId,
                title = item.title,
                description = item.content,
                priority = "medium"
            )
            repository.insertTask(task)
            repository.updateInboxItem(item.copy(status = "processed", convertedTo = "task"))
        }
    }

    fun deleteInboxItem(id: String) {
        viewModelScope.launch {
            repository.deleteInboxItem(id)
        }
    }

    // --- FOCUS TIMER ---
    fun startFocusSession(task: TaskEntity?, durationMinutes: Int = 25, mode: String = "pomodoro") {
        selectedFocusTask.value = task
        focusMode.value = mode
        focusTotalSeconds.value = durationMinutes * 60
        focusSecondsRemaining.value = durationMinutes * 60
        isFocusTimerRunning.value = true
        focusDistractionCount.value = 0

        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (focusSecondsRemaining.value > 0 && isFocusTimerRunning.value) {
                delay(1000)
                focusSecondsRemaining.value -= 1
            }
            if (focusSecondsRemaining.value == 0) {
                completeFocusSession()
            }
        }
    }

    fun pauseFocusTimer() {
        isFocusTimerRunning.value = false
        timerJob?.cancel()
    }

    fun resumeFocusTimer() {
        if (focusSecondsRemaining.value > 0) {
            isFocusTimerRunning.value = true
            timerJob?.cancel()
            timerJob = viewModelScope.launch {
                while (focusSecondsRemaining.value > 0 && isFocusTimerRunning.value) {
                    delay(1000)
                    focusSecondsRemaining.value -= 1
                }
                if (focusSecondsRemaining.value == 0) {
                    completeFocusSession()
                }
            }
        }
    }

    fun recordDistraction() {
        focusDistractionCount.value += 1
    }

    fun completeFocusSession(notes: String = "") {
        pauseFocusTimer()
        viewModelScope.launch {
            val duration = focusTotalSeconds.value - focusSecondsRemaining.value
            val session = FocusSessionEntity(
                id = UUID.randomUUID().toString(),
                taskId = selectedFocusTask.value?.id,
                taskTitle = selectedFocusTask.value?.title ?: "جلسة تركيز عامة",
                mode = focusMode.value,
                durationSeconds = if (duration > 0) duration else focusTotalSeconds.value,
                date = todayDateKey,
                distractionsCount = focusDistractionCount.value,
                notes = notes
            )
            repository.insertFocusSession(session)
        }
    }

    fun saveReview(frequency: String, title: String, wins: String, challenges: String, lessons: String, commitments: String, rating: Int) {
        viewModelScope.launch {
            val review = SystemReviewEntity(
                id = UUID.randomUUID().toString(),
                frequency = frequency,
                date = todayDateKey,
                title = title,
                rating = rating,
                wins = wins,
                challenges = challenges,
                lessons = lessons,
                nextCommitments = commitments,
                systemHealthScore = Math.min(100, (rating * 10) + 5),
                smartSummary = "مراجعة دورية مكتملة: تم تقييم التقدم بنسبة ${rating}/10 مع الالتزام بالأولويات القادمة."
            )
            repository.insertReview(review)
        }
    }

    // --- TIME BLOCKING ---
    fun addTimeBlock(title: String, startTime: String, endTime: String, category: String) {
        viewModelScope.launch {
            val block = TimeBlockEntity(
                id = UUID.randomUUID().toString(),
                date = todayDateKey,
                startTime = startTime,
                endTime = endTime,
                title = title,
                category = category
            )
            repository.insertTimeBlock(block)
        }
    }

    fun toggleTimeBlock(block: TimeBlockEntity) {
        viewModelScope.launch {
            repository.updateTimeBlock(block.copy(isCompleted = !block.isCompleted))
        }
    }

    fun deleteTimeBlock(id: String) {
        viewModelScope.launch {
            repository.deleteTimeBlock(id)
        }
    }

    // --- VAULTS & LEARNING ---
    fun addVaultItem(pillarId: String, title: String, vaultType: String, author: String, totalUnits: Int) {
        viewModelScope.launch {
            val item = VaultItemEntity(
                id = UUID.randomUUID().toString(),
                pillarId = pillarId,
                title = title,
                vaultType = vaultType,
                author = author,
                totalUnits = totalUnits,
                completedUnits = 0
            )
            repository.insertVaultItem(item)
        }
    }

    fun updateVaultProgress(item: VaultItemEntity, newCompleted: Int) {
        viewModelScope.launch {
            val updated = item.copy(
                completedUnits = Math.min(item.totalUnits, newCompleted),
                status = if (newCompleted >= item.totalUnits) "completed" else "reading"
            )
            repository.updateVaultItem(updated)
        }
    }

    fun deleteVaultItem(id: String) {
        viewModelScope.launch {
            repository.deleteVaultItem(id)
        }
    }

    // --- JOURNALS ---
    fun addJournalEntry(title: String, content: String, mood: String, tags: String) {
        viewModelScope.launch {
            val entry = JournalEntryEntity(
                id = UUID.randomUUID().toString(),
                title = title,
                content = content,
                entryDate = todayDateKey,
                mood = mood,
                tagsCsv = tags
            )
            repository.insertJournal(entry)
        }
    }
}
