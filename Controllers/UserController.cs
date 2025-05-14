using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Repositories;

namespace RealEstateHubAPI.Controllers
{
    [Route("api/users")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        public UserController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }
        [HttpGet]

 public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _userRepository.GetUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                var users = await _userRepository.GetUserByIdAsync(id);
                if (users == null)
                    return NotFound();
                return Ok(users);
            }
            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpPost]
        public async Task<IActionResult> AddUser([FromBody] User user)
        {
            try
            {
                await _userRepository.AddUserAsync(user);
                return CreatedAtAction(nameof(GetUserById), new
                {
                    id =
               user.Id
                }, user);
            }

            catch (Exception ex)
            {
                // Handle exception
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] User user)

             {
             try
             {
             if (id != user.Id)
             return BadRequest();
                    await _userRepository.UpdateUserAsync(user);
             return NoContent();
                }
             catch (Exception ex)
             {
             // Handle exception
             return StatusCode(500, "Internal server error");
            }
             }
             [HttpDelete("{id}")]
            public async Task<IActionResult> DeleteUser(int id)
            {
                try
                {
                    await _userRepository.DeleteUserAsync(id);
                    return NoContent();
                }
                catch (Exception ex)
                {
                    // Handle exception
                    return StatusCode(500, "Internal server error");
                }
            }
            }
                }

