<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $titre }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4F6F8;">
    <div style="max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
        <div style="text-align: center; border-bottom: 3px solid #1B4332; padding-bottom: 15px; margin-bottom: 25px;">
            <h2 style="color: #1B4332; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">FECAFOOT PLATFORM</h2>
            <span style="font-size: 11px; text-transform: uppercase; color: #2D6A4F; font-weight: bold; letter-spacing: 1px;">Administration MTN Elite One & Two</span>
        </div>
        
        <h3 style="color: #2D6A4F; font-size: 18px; margin-top: 0; margin-bottom: 15px;">{{ $titre }}</h3>
        
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 25px;">
            {{ $messageContenu }}
        </p>
        
        @if($lien)
            <div style="text-align: center; margin-top: 35px; margin-bottom: 25px;">
                <a href="{{ $lien }}" style="background-color: #2D6A4F; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(45, 106, 79, 0.2); display: inline-block; transition: all 0.2s;">Accéder à la plateforme</a>
            </div>
        @endif
        
        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin-top: 35px; margin-bottom: 20px;">
        
        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0;">
            Ce message a été généré automatiquement par la plateforme FECAFOOT.<br>
            Merci de ne pas y répondre directement.
        </p>
    </div>
</body>
</html>
