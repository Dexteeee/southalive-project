using AdminApi.Models;
public interface IEmailService
{
    Task SendNewRegistrationAlertAsync(Volunteer volunteer);
    Task SendRegistrationReceivedAsync(Volunteer volunteer);
    Task SendApprovalConfirmationAsync(Volunteer volunteer, Area area);
}