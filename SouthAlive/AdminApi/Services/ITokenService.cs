using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AdminApi.Models;

namespace AdminApi.Services
{
    public interface ITokenService
    {
        string CreateToken(Admin admin);
    }
}