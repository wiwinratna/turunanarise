<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #7c5cfc; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">{{ $title }}</h2>
        </div>
        <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Hello <strong>{{ $recipientName }}</strong>,</p>
            <p style="font-size: 15px; color: #555; line-height: 1.5;">{{ $bodyMessage }}</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #7c5cfc; padding: 15px; margin-top: 20px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #475569;">
                    <strong>Subject:</strong> {{ $ticketSubject }}<br>
                </p>
            </div>

            <div style="margin-top: 30px; text-align: center;">
                <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}" style="display: inline-block; padding: 12px 24px; background-color: #7c5cfc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Ticket</a>
            </div>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; {{ date('Y') }} Support Ticketing System.</p>
        </div>
    </div>
</body>
</html>
