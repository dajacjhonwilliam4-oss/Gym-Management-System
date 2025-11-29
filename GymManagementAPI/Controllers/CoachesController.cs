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
    private readonly IUserService _userService;

    public CoachesController(ICoachService coachService, IUserService userService)
    {
        _coachService = coachService;
        _userService = userService;
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
            
            // Auto-create user account for coach
            if (!string.IsNullOrEmpty(coach.Email))
            {
                try
                {
                    // Check if user already exists
                    var existingUsers = await _userService.GetAllAsync();
                    var userExists = existingUsers.Any(u => u.Email == coach.Email);
                    
                    if (!userExists)
                    {
                        // Create user account with default password
                        var user = new User
                        {
                            Name = coach.Name,
                            Email = coach.Email,
                            Password = "coach123", // Default password (will be hashed)
                            Role = "coach",
                            AuthProvider = "local",
                            IsActive = true
                        };
                        
                        await _userService.CreateAsync(user);
                    }
                }
                catch (Exception userEx)
                {
                    // Log but don't fail coach creation if user creation fails
                    Console.WriteLine($"Failed to create user account: {userEx.Message}");
                }
            }
            
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
