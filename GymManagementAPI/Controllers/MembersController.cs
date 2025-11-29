using GymManagementAPI.Models;
using GymManagementAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagementAPI.Controllers;

[ApiController]
[Route("api/members")]
[Authorize] // Require authentication for all endpoints
public class MembersController : ControllerBase
{
    private readonly IMemberService _memberService;
    private readonly IUserService _userService;

    public MembersController(IMemberService memberService, IUserService userService)
    {
        _memberService = memberService;
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var members = await _memberService.GetAllAsync();
            return Ok(members);
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
            var member = await _memberService.GetByIdAsync(id);
            if (member == null)
            {
                return NotFound(new { error = "Member not found" });
            }
            return Ok(member);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin")] // Only admin can create members
    public async Task<IActionResult> Create([FromBody] Member member)
    {
        try
        {
            var createdMember = await _memberService.CreateAsync(member);
            
            // Auto-create user account for non-trial members
            if (!string.IsNullOrEmpty(member.Email) && 
                !member.Email.Contains("@trial.local") && 
                member.MembershipType?.ToLower() != "trial")
            {
                try
                {
                    // Check if user already exists
                    var existingUsers = await _userService.GetAllAsync();
                    var userExists = existingUsers.Any(u => u.Email == member.Email);
                    
                    if (!userExists)
                    {
                        // Create user account with default password
                        var user = new User
                        {
                            Name = member.Name,
                            Email = member.Email,
                            Password = "member123", // Default password (will be hashed)
                            Role = "member",
                            AuthProvider = "local",
                            IsActive = true
                        };
                        
                        await _userService.CreateAsync(user);
                    }
                }
                catch (Exception userEx)
                {
                    // Log but don't fail member creation if user creation fails
                    Console.WriteLine($"Failed to create user account: {userEx.Message}");
                }
            }
            
            return StatusCode(201, createdMember);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")] // Only admin can update members
    public async Task<IActionResult> Update(string id, [FromBody] Member member)
    {
        try
        {
            member.Id = id;
            var updatedMember = await _memberService.UpdateAsync(id, member);
            if (updatedMember == null)
            {
                return NotFound(new { error = "Member not found" });
            }
            return Ok(updatedMember);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")] // Only admin can delete members
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var deleted = await _memberService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { error = "Member not found" });
            }
            return Ok(new { message = "Member deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
