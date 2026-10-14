# Food, Water, Shelter — Desert Simulation

Version 4 — règles actualisées le 14 octobre 2026 selon les derniers retours d’Ileah. Étapes 1 à 3 : règles actualisées et deux écrans pédagogiques intégrés avec les textes anglais fournis par Ileah le 13 octobre. Logo et palette STEM Education, images des cartes physiques et commandes en haut ajoutés.

## Ouvrir et jouer

Ouvrir `index.html` dans Edge, Chrome ou Firefox. Si la page est déjà ouverte, la recharger (Ctrl+F5) pour charger les corrections. Conserver le dossier `src` et `styles.css` avec le fichier HTML.

1. Lire l’écran **Read the habitat**, choisir éventuellement **Drought** et/ou **Wildfire**, puis utiliser son bouton **Start**.
2. Glisser un lézard sur sa ressource, ou sélectionner le lézard puis la ressource.
3. Observer les compteurs, les crânes temporaires, le graphique et le feedback.
4. **Pause / Resume** suspend/reprend tous les délais ; **Reset** revient à l’introduction, remet la partie à zéro et permet de modifier les options.
5. Après chaque incendie, le temps s’arrête exactement à cet événement. Lire l’explication écologique, puis choisir **Resume** sur cet écran. Le temps de lecture ne consomme ni la durée de vie des lézards ni le délai jusqu’au prochain incendie.

Chaque lézard a **10 secondes à partir de son apparition**. Une réussite remplace le parent et la ressource par deux nouveau-nés, chacun avec un nouveau besoin aléatoire et dix secondes. Sans réussite à temps, le lézard meurt et une ressource apparaît. Les modes « sans limite » et « 20 secondes » ont été retirés de l’interface. Le moteur accepte encore une durée finie pour les essais techniques de calibration ; elle n’est pas proposée aux élèves.

Sans intervention, les dix lézards de départ meurent ensemble à dix secondes. Zéro lézard termine la session ; Reset permet de recommencer. Quitter l’onglet met la simulation en pause, sans reprise automatique.

## Interface et accessibilité

Les commandes Pause/Resume et Reset sont au-dessus du jeu et restent visibles au défilement (sauf écrans très bas). Sur grand écran : terrain à gauche, compteurs et options à droite, graphique en dessous à gauche et feedback à droite. Sur petit écran, les blocs s’empilent. Start reste dans l’introduction ; Resume après incendie reste dans l’écran pédagogique.

- Souris, stylet et toucher : glisser-déposer, ou sélection puis association.
- Au toucher, faire défiler depuis une zone qui n’est pas un lézard ; les lézards réservent le geste au déplacement.
- Clavier : Tab, Entrée/Espace, Échap pour annuler.
- Le tableau contient tous les relevés depuis le départ ; il est défilant. Reset efface l’historique de la session précédente.
- Les résultats restent en mémoire dans la page jusqu’au reset ou à sa fermeture. Pas de compte élève, installation, base de données ni envoi des données.

## Règles et extensions

- Départ normal : 10 lézards et 30 ressources, dont le type est tiré au hasard indépendamment, avec une chance sur trois pour chaque type.
- Positions aléatoires dans des cases séparées pour garder les cibles lisibles. La grille reste un choix de présentation ; les quantités par type varient à chaque réinitialisation.
- Mauvaise ressource : aucune consommation ; le délai continue.
- À chaque mort, une nouvelle ressource aléatoire apparaît. Graphique et compteurs enregistrent cet événement immédiatement, même entre deux secondes.
- Sans incendie, lézards + ressources = 40.
- **Drought** : poids Food/Water/Shelter = 2/1/2 pour les ressources initiales et retournées (40 % / 20 % / 40 %). L’eau est donc deux fois moins probable que chacune des autres ressources, et non une probabilité absolue de 50 %. Le départ conserve 30 ressources tirées indépendamment selon ces poids. Les besoins des lézards restent équiprobables, même en sécheresse.
- **Wildfire** : intervalle aléatoire uniforme de 15 à 30 secondes de simulation. La moitié des abris disparaît, arrondie au supérieur en cas de nombre impair (3 sur 5, par exemple). Les abris détruits sont choisis au hasard sans répétition ; aucune restauration automatique programmée. Des morts ultérieures peuvent produire du sagebrush. Les incendies diminuent le total lézards + ressources : la conservation à 40 ne s’applique plus.
- Les deux extensions sont désactivées au départ. Elles sont présentes pour répondre à la demande d’appliquer tous les éléments de l’audit ; Ileah permettait de les reporter après le prototype.

L’historique complet est conservé en mémoire et enregistré chaque seconde, à chaque association réussie, à chaque mort, à chaque incendie et à la pause. Aucune stabilisation ni tendance n’est artificiellement ajoutée aux courbes.

## Vérifications

Les tests incluent aussi les pauses exactes après incendie et le parcours introduction → Start → incendie → Resume → Reset dans un DOM simulé (sans rendu navigateur). Les tests du moteur et des données couvrent notamment : échéances exactes, pause, reset, reproduction, mort et retour de ressource, mises à jour entre deux secondes, historique complet, fréquence de l’eau, incendie et retour naturel des abris.

Les essais reproductibles `../work/calibrate.cjs` simulent des associations toutes les 0,5, 1 ou 1,5 seconde sur deux minutes, avec trois graines aléatoires, avec/sans extensions. Ils servent à examiner le comportement, pas à certifier l’expérience des élèves. Les résultats de calibration obtenus avec les anciennes règles ne valident pas les paramètres de cette version. Le rythme des associations influence donc fortement le plateau. La calibration pédagogique reste à faire avec DRI et des utilisateurs réels ; notamment l’intensité des effets sécheresse/incendie.

**Limite de vérification :** aucun rendu navigateur ni geste tactile réel n’a été confirmé dans cet environnement. Les restrictions précédemment rencontrées n’ont pas été contournées. Les scénarios navigateur `../work/verify-ui.cjs` ont été adaptés, mais restent à exécuter dans un environnement autorisé. Aucune certification Section 508 ni validation graphique DRI n’est revendiquée.

Les changements de cette version 4 sont locaux et ne sont pas publiés en ligne. L’hébergement final, la revue graphique/pédagogique DRI et les tests multi-navigateurs/appareils restent à organiser.

## Maintenance

Avec Node.js, dans ce dossier :

```powershell
node --test
```

Diagnostic pédagogique reproductible :

```powershell
node ../work/calibrate.cjs
```

La sauvegarde avant corrections est dans `../work/before-conformity-2026-10-07`.

## Download results

Use **Download table (CSV)** or **Download graph (PNG)** above the graph. Exports capture the full recorded history at the moment of the click; the simulation is not automatically paused. CSV contains time in seconds and the four counters, with UTF-8 encoding and comma separators. If Excel displays one column, import the file via Data > From Text/CSV and choose comma as delimiter. PNG is 1400 × 850 pixels and includes the graph, legend, axes and scenario settings. Both exports work locally without sending data to a server. Reset clears the history used by subsequent exports. Actual browser downloads and visual PNG rendering still require user verification in this environment.

## Optional sound effects

Version 3 is preserved unchanged in the sibling food-water-shelter-v3 folder. Version 4 adds only sound and its toggle. Sound starts off. Use **Sound: off** in the top controls to enable it (a short confirmation tone plays). A successful match plays two soft rising notes, deaths trigger a short low tone, and wildfire plays a brief dry crackle. Repeated death sounds are rate-limited. Pause, Reset, mute and leaving the tab stop active effects. No music, external sound files, network requests or saved preference. Effects use the browser Web Audio API and do not change simulation rules. If audio is unsupported, the game remains silent and usable. Actual listening on the user device remains to be verified.
