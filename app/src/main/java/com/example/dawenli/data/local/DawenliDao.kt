package com.example.dawenli.data.local

import androidx.room.*
import com.example.dawenli.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface DawenliDao {

    // --- PILLARS ---
    @Query("SELECT * FROM pillars ORDER BY priority ASC, createdAt ASC")
    fun getAllPillars(): Flow<List<PillarEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPillars(pillars: List<PillarEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPillar(pillar: PillarEntity)

    @Update
    suspend fun updatePillars(pillars: List<PillarEntity>)

    @Query("DELETE FROM pillars WHERE id = :id")
    suspend fun deletePillarById(id: String)

    // --- VISIONS ---
    @Query("SELECT * FROM visions ORDER BY createdAt ASC")
    fun getAllVisions(): Flow<List<VisionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVisions(visions: List<VisionEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVision(vision: VisionEntity)

    @Update
    suspend fun updateVisions(visions: List<VisionEntity>)

    @Query("DELETE FROM visions WHERE id = :id")
    suspend fun deleteVisionById(id: String)

    // --- GOALS ---
    @Query("SELECT * FROM value_goals ORDER BY createdAt ASC")
    fun getAllGoals(): Flow<List<ValueGoalEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGoals(goals: List<ValueGoalEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGoal(goal: ValueGoalEntity)

    @Update
    suspend fun updateGoals(goals: List<ValueGoalEntity>)

    @Query("DELETE FROM value_goals WHERE id = :id")
    suspend fun deleteGoalById(id: String)

    // --- PROJECTS ---
    @Query("SELECT * FROM projects ORDER BY createdAt ASC")
    fun getAllProjects(): Flow<List<ProjectEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjects(projects: List<ProjectEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProject(project: ProjectEntity)

    @Update
    suspend fun updateProjects(projects: List<ProjectEntity>)

    @Query("DELETE FROM projects WHERE id = :id")
    suspend fun deleteProjectById(id: String)

    // --- TASKS ---
    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTasks(tasks: List<TaskEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE id = :id")
    suspend fun deleteTaskById(id: String)

    // --- HABITS ---
    @Query("SELECT * FROM habits ORDER BY createdAt ASC")
    fun getAllHabits(): Flow<List<HabitEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabits(habits: List<HabitEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabit(habit: HabitEntity)

    @Update
    suspend fun updateHabit(habit: HabitEntity)

    @Query("DELETE FROM habits WHERE id = :id")
    suspend fun deleteHabitById(id: String)

    // --- INBOX ---
    @Query("SELECT * FROM inbox_items ORDER BY createdAt DESC")
    fun getAllInboxItems(): Flow<List<InboxEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInboxItem(item: InboxEntity)

    @Update
    suspend fun updateInboxItem(item: InboxEntity)

    @Query("DELETE FROM inbox_items WHERE id = :id")
    suspend fun deleteInboxItemById(id: String)

    // --- WORSHIP ---
    @Query("SELECT * FROM worship_definitions ORDER BY sortOrder ASC, createdAt ASC")
    fun getAllWorshipDefinitions(): Flow<List<WorshipDefinitionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorshipDefinitions(items: List<WorshipDefinitionEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorshipDefinition(item: WorshipDefinitionEntity)

    @Query("SELECT * FROM worship_logs WHERE date = :date")
    fun getWorshipLogsByDate(date: String): Flow<List<WorshipLogEntity>>

    @Query("SELECT * FROM worship_logs")
    fun getAllWorshipLogs(): Flow<List<WorshipLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorshipLog(log: WorshipLogEntity)

    // --- REVIEWS ---
    @Query("SELECT * FROM system_reviews ORDER BY date DESC")
    fun getAllReviews(): Flow<List<SystemReviewEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReview(review: SystemReviewEntity)

    // --- FOCUS ---
    @Query("SELECT * FROM focus_sessions ORDER BY createdAt DESC")
    fun getAllFocusSessions(): Flow<List<FocusSessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFocusSession(session: FocusSessionEntity)

    // --- JOURNALS ---
    @Query("SELECT * FROM journals ORDER BY entryDate DESC")
    fun getAllJournals(): Flow<List<JournalEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJournal(journal: JournalEntryEntity)

    // --- TIME BLOCKS ---
    @Query("SELECT * FROM time_blocks WHERE date = :date ORDER BY startTime ASC")
    fun getTimeBlocksByDate(date: String): Flow<List<TimeBlockEntity>>

    @Query("SELECT * FROM time_blocks ORDER BY date DESC, startTime ASC")
    fun getAllTimeBlocks(): Flow<List<TimeBlockEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTimeBlock(block: TimeBlockEntity)

    @Update
    suspend fun updateTimeBlock(block: TimeBlockEntity)

    @Query("DELETE FROM time_blocks WHERE id = :id")
    suspend fun deleteTimeBlockById(id: String)

    // --- VAULTS ---
    @Query("SELECT * FROM vault_items ORDER BY createdAt DESC")
    fun getAllVaultItems(): Flow<List<VaultItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVaultItem(item: VaultItemEntity)

    @Update
    suspend fun updateVaultItem(item: VaultItemEntity)

    @Query("DELETE FROM vault_items WHERE id = :id")
    suspend fun deleteVaultItemById(id: String)
}
