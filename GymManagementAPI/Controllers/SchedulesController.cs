using GymManagementAPI.Models;
using GymManagementAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace GymManagementAPI.Controllers;

[ApiController]
[Route("api/schedules")]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public SchedulesController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var schedules = await _scheduleService.GetAllAsync();
            return Ok(schedules);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var schedule = await _scheduleService.GetByIdAsync(id);
            if (schedule == null)
            {
                return NotFound(new { error = "Schedule not found" });
            }
            return Ok(schedule);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Schedule schedule)
    {
        try
        {
            var createdSchedule = await _scheduleService.CreateAsync(schedule);
            return StatusCode(201, createdSchedule);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Schedule schedule)
    {
        try
        {
            schedule.Id = id;
            var updatedSchedule = await _scheduleService.UpdateAsync(id, schedule);
            if (updatedSchedule == null)
            {
                return NotFound(new { error = "Schedule not found" });
            }
            return Ok(updatedSchedule);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var deleted = await _scheduleService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { error = "Schedule not found" });
            }
            return Ok(new { message = "Schedule deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("{id}/enroll")]
    public async Task<IActionResult> EnrollMember(string id, [FromBody] EnrollRequest request)
    {
        try
        {
            var schedule = await _scheduleService.GetByIdAsync(id);
            if (schedule == null)
            {
                return NotFound(new { error = "Schedule not found" });
            }

            // Check if already enrolled
            if (schedule.EnrolledMembers.Contains(request.UserId))
            {
                return BadRequest(new { error = "Already enrolled in this class" });
            }

            // Check capacity
            if (schedule.Capacity.HasValue && schedule.EnrolledMembers.Count >= schedule.Capacity.Value)
            {
                return BadRequest(new { error = "Class is full" });
            }

            // Check if schedule is in the past
            var scheduleDateTime = DateTime.Parse($"{schedule.Date} {schedule.StartTime}");
            if (scheduleDateTime < DateTime.Now)
            {
                return BadRequest(new { error = "Cannot enroll in past classes" });
            }

            // Check for time conflicts with other enrolled classes
            var allSchedules = await _scheduleService.GetAllAsync();
            var userEnrolledSchedules = allSchedules.Where(s => s.EnrolledMembers.Contains(request.UserId)).ToList();
            
            foreach (var enrolledSchedule in userEnrolledSchedules)
            {
                // Check if on the same date
                if (enrolledSchedule.Date == schedule.Date)
                {
                    // Parse times for conflict detection
                    var newStart = TimeSpan.Parse(schedule.StartTime);
                    var newEnd = TimeSpan.Parse(schedule.EndTime);
                    var existingStart = TimeSpan.Parse(enrolledSchedule.StartTime);
                    var existingEnd = TimeSpan.Parse(enrolledSchedule.EndTime);
                    
                    // Check if times overlap
                    if (newStart < existingEnd && newEnd > existingStart)
                    {
                        return BadRequest(new { 
                            error = $"Time conflict: You are already enrolled in '{enrolledSchedule.ClassName}' from {enrolledSchedule.StartTime} to {enrolledSchedule.EndTime}"
                        });
                    }
                }
            }

            // Add member to enrolled list
            schedule.EnrolledMembers.Add(request.UserId);
            schedule.UpdatedAt = DateTime.UtcNow;
            
            var updated = await _scheduleService.UpdateAsync(id, schedule);
            return Ok(new { 
                message = "Successfully enrolled in class",
                enrolledCount = schedule.EnrolledMembers.Count,
                capacity = schedule.Capacity
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("{id}/unenroll")]
    public async Task<IActionResult> UnenrollMember(string id, [FromBody] EnrollRequest request)
    {
        try
        {
            var schedule = await _scheduleService.GetByIdAsync(id);
            if (schedule == null)
            {
                return NotFound(new { error = "Schedule not found" });
            }

            // Check if enrolled
            if (!schedule.EnrolledMembers.Contains(request.UserId))
            {
                return BadRequest(new { error = "Not enrolled in this class" });
            }

            // Remove member from enrolled list
            schedule.EnrolledMembers.Remove(request.UserId);
            schedule.UpdatedAt = DateTime.UtcNow;
            
            var updated = await _scheduleService.UpdateAsync(id, schedule);
            return Ok(new { 
                message = "Successfully unenrolled from class",
                enrolledCount = schedule.EnrolledMembers.Count,
                capacity = schedule.Capacity
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

public class EnrollRequest
{
    public string UserId { get; set; } = string.Empty;
}
