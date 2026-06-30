<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de votre mot de passe FECAFOOT</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #F0F4F0; color: #1E293B; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #C8102E 0%, #E53946 100%); padding: 40px 32px; text-align: center; }
        .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin-top: 12px; }
        .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 6px; }
        .body { padding: 40px 32px; }
        .greeting { font-size: 18px; font-weight: 600; color: #1B4332; margin-bottom: 12px; }
        .text { color: #64748B; font-size: 15px; line-height: 1.7; margin-bottom: 24px; }
        .password-box { background: #FFF5F5; border: 2px solid #C8102E; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
        .password-box p { color: #64748B; font-size: 13px; margin-bottom: 12px; }
        .password-value { font-size: 22px; font-weight: 700; font-family: 'Courier New', monospace; color: #C8102E; background: #fff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #C8102E; display: inline-block; letter-spacing: 2px; }
        .cta-button { display: block; text-align: center; background: #1B4332; color: #fff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 16px 32px; border-radius: 10px; margin: 28px 0; }
        .warning-box { background: #FFFBEB; border: 1px solid #FFB800; border-radius: 10px; padding: 16px; margin-top: 20px; display: flex; gap: 12px; }
        .warning-text { color: #92400E; font-size: 13px; line-height: 1.6; }
        .footer { background: #F8F9FA; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0; }
        .footer p { color: #64748B; font-size: 12px; line-height: 1.6; }
        .footer strong { color: #1B4332; }
        .shield-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 32px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <!-- Header -->
        <div class="header">
            <div class="shield-icon">🔒</div>
            <h1>Réinitialisation du mot de passe</h1>
            <p>FECAFOOT — Plateforme de gestion des championnats</p>
        </div>

        <!-- Body -->
        <div class="body">
            <p class="greeting">Bonjour, {{ $prenom }} {{ $nom }}</p>
            <p class="text">
                L'administrateur de la plateforme <strong>FECAFOOT</strong> a réinitialisé votre mot de passe. 
                Voici votre nouveau mot de passe temporaire :
            </p>

            <!-- Nouveau mot de passe -->
            <div class="password-box">
                <p>Votre nouveau mot de passe temporaire</p>
                <span class="password-value">{{ $motDePasse }}</span>
            </div>

            <!-- CTA -->
            <a href="{{ $loginUrl }}" class="cta-button">
                🔑 Se connecter maintenant
            </a>

            <!-- Warning -->
            <div class="warning-box">
                <span style="font-size:20px; flex-shrink:0;">⚠️</span>
                <p class="warning-text">
                    <strong>Sécurité :</strong> Vous devrez changer ce mot de passe dès votre première connexion. 
                    Ne partagez jamais votre mot de passe avec qui que ce soit. 
                    Si vous n'avez pas demandé cette réinitialisation, contactez immédiatement l'administrateur.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                © {{ date('Y') }} <strong>Fédération Camerounaise de Football (FECAFOOT)</strong><br>
                Cet email est envoyé automatiquement — ne pas y répondre.
            </p>
        </div>
    </div>
</body>
</html>
