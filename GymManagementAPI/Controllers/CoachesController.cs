using GymManagementAPI.Models;
using GymManagementAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagementAPI.Controllers;

[ApiController]
[Route("api/coaches")]
[Authorize] // Require authentication for all endpoints
public class CoachesController : ControllerBase
{
    private readonly ICoachService _coachService;

    public CoachesController(ICoachService coachService)
    {
        _coachService = coachService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var coaches = await _coachService.GetAllAsync();
            return Ok(coaches);
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
            var coach = await _coachService.GetByIdAsync(id);
            if (coach == null)
            {
                return NotFound(new { error = "Coach not found" });
            }
            return Ok(coach);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")] // Only admin can create coaches
    public async Task<IActionResult> Create([FromBody] Coach coach)
    {
        try
        {
            var createdCoach = await _coachService.CreateAsync(coach);
            return StatusCode(201, createdCoach);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")] // Only admin can update coaches
    public async Task<IActionResult> Update(string id, [FromBody] Coach coach)
    {
        try
        {
            coach.Id = id;
            var updatedCoach = await _coachService.UpdateAsync(id, coach);
            if (updatedCoach == null)
            {
                return NotFound(new { error = "Coach not found" });
            }
            return Ok(updatedCoach);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")] // Only admin can delete coaches
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var deleted = await _coachService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { error = "Coach not found" });
            }
            return Ok(new { message = "Coach deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("clear-all")]
    [Authorize(Roles = "admin")] // Only admin can clear all coaches
    public async Task<IActionResult> ClearAll()
    {
        try
        {
            var count = await _coachService.DeleteAllAsync();
            return Ok(new { message = $"Deleted {count} coaches successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
