<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre compte FECAFOOT a été créé</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #F0F4F0; color: #1E293B; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%); padding: 40px 32px; text-align: center; }
        .header-logo { width: 64px; height: 64px; background: #FFB800; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .header h1 { color: #FFB800; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.7); font-size: 14px; margin-top: 6px; }
        .body { padding: 40px 32px; }
        .greeting { font-size: 18px; font-weight: 600; color: #1B4332; margin-bottom: 12px; }
        .text { color: #64748B; font-size: 15px; line-height: 1.7; margin-bottom: 24px; }
        .credentials-box { background: #F8F9FA; border: 2px solid #E2E8F0; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .credentials-box h3 { color: #1B4332; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
        .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #E2E8F0; }
        .credential-row:last-child { border-bottom: none; }
        .credential-label { color: #64748B; font-size: 13px; font-weight: 500; }
        .credential-value { color: #1E293B; font-size: 14px; font-weight: 700; font-family: 'Courier New', monospace; background: #fff; padding: 4px 10px; border-radius: 6px; border: 1px solid #E2E8F0; }
        .cta-button { display: block; text-align: center; background: #C8102E; color: #fff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 16px 32px; border-radius: 10px; margin: 28px 0; transition: background 0.2s; }
        .warning-box { background: #FFFBEB; border: 1px solid #FFB800; border-radius: 10px; padding: 16px; margin-top: 20px; display: flex; gap: 12px; }
        .warning-icon { font-size: 20px; flex-shrink: 0; }
        .warning-text { color: #92400E; font-size: 13px; line-height: 1.6; }
        .footer { background: #F8F9FA; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0; }
        .footer p { color: #64748B; font-size: 12px; line-height: 1.6; }
        .footer strong { color: #1B4332; }
        .role-badge { display: inline-block; background: #1B4332; color: #FFB800; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <!-- Header -->
        <div class="header">
            <div class="header-logo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#1B4332">
                    <path d="M12 2L4 7v10l8 5 8-5V7L12 2z"/>
                </svg>
            </div>
            <h1>🇨🇲 FECAFOOT</h1>
            <p>Fédération Camerounaise de Football</p>
        </div>

        <!-- Body -->
        <div class="body">
            <div class="role-badge">{{ $roleLabel }}</div>
            <p class="greeting">Bienvenue, {{ $prenom }} {{ $nom }} !</p>
            <p class="text">
                Votre compte sur la plateforme de gestion des championnats de la <strong>FECAFOOT</strong> 
                vient d'etre cree avec succes. Voici vos identifiants de connexion :
            </p>

            <!-- Credentials -->
            <div class="credentials-box">
                <h3>🔐 Vos identifiants de connexion</h3>
                <div class="credential-row">
                    <span class="credential-label">Adresse email</span>
                    <span class="credential-value">{{ $email }}</span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Mot de passe temporaire</span>
                    <span class="credential-value">{{ $motDePasse }}</span>
                </div>
                @if($clubNom)
                <div class="credential-row">
                    <span class="credential-label">Club assigné</span>
                    <span class="credential-value">{{ $clubNom }}</span>
                </div>
                @endif
            </div>

            <!-- CTA -->
            <a href="{{ $loginUrl }}" class="cta-button">
                Se connecter à la plateforme →
            </a>

            <!-- Warning -->
            <div class="warning-box">
                <span class="warning-icon">⚠️</span>
                <p class="warning-text">
                    <strong>Important :</strong> Lors de votre première connexion, vous devrez obligatoirement 
                    changer ce mot de passe temporaire. Conservez bien ces informations, elles ne vous 
                    seront envoyées qu'une seule fois.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                Cet email a été envoyé automatiquement par la plateforme <strong>FECAFOOT</strong>.<br>
                Si vous n'attendiez pas cet email, veuillez contacter l'administrateur.<br><br>
                © {{ date('Y') }} Fédération Camerounaise de Football. Tous droits réservés.
            </p>
        </div>
    </div>
</body>
</html>
