# TotiChat staging APK build request

This commit triggers the existing staging Android debug APK workflow after the numeric public ID correction in `RoyalRoomsView.tsx` (commit `d54b04aa44772905ef76b8a435e18441a926a2dc`).

Branch: `integration/legacy-backend-staging`.
Production and main remain unchanged.

Known open issues: VIP profile preview still requires validation; other UUID display surfaces are not yet exhaustively audited.
