# run-and-bike-trainer — déménagé

L'application vit désormais dans le dépôt `Jeremy1277/Mes-recettes`, sous
`run-and-bike/`, et est servie sur **https://studio-42.app/run-and-bike/**
avec les trois autres applications de Studio 42.

Les trois pages de ce dépôt (`index.html`, `velo.html`, `course.html`) ne sont
plus que des redirections, qui reportent la chaîne de requête : le backend
Strava renvoie ici avec `?connected=true` ou `?strava_error=…` tant que la
variable `FRONTEND_URL` n'a pas été changée sur Render.

Le reste des fichiers est conservé tel quel : la dernière version fonctionnelle
servie depuis ce dépôt est le commit `17d6c62`.

Le backend n'est pas ici : `Jeremy1277/run-and-bike-trainer-api`, déployé sur
Render. Les données non plus : `Jeremy1277/run-and-bike-trainer-data` (privé).
