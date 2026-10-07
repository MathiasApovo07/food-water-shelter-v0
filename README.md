# Food, Water, Shelter — Desert Simulation

Version locale corrigée selon le PDF d’Ileah et le layout fourni, le 7 octobre 2026.

## Ouvrir et jouer

Ouvrir `index.html` dans Edge, Chrome ou Firefox. Si la page est déjà ouverte, la recharger (Ctrl+F5) pour charger les corrections. Conserver le dossier `src` et `styles.css` avec le fichier HTML.

1. Choisir éventuellement **Drought** et/ou **Wildfire**, puis **Start**.
2. Glisser un lézard sur sa ressource, ou sélectionner le lézard puis la ressource.
3. Observer les compteurs, les crânes temporaires, le graphique et le feedback.
4. **Pause / Resume** suspend/reprend tous les délais ; **Reset** recommence avec les options choisies et permet de les modifier.

Chaque lézard a **8 secondes à partir de son apparition**. Une réussite remplace le parent et la ressource par deux nouveau-nés, chacun avec un nouveau besoin aléatoire et huit secondes. Sans réussite à temps, le lézard meurt et une ressource apparaît. Les modes « sans limite » et « 20 secondes » ont été retirés de l’interface. Le moteur accepte encore une durée finie pour les essais techniques de calibration ; elle n’est pas proposée aux élèves.

Sans intervention, les dix lézards de départ meurent ensemble à huit secondes. Zéro lézard termine la session ; Reset permet de recommencer. Quitter l’onglet met la simulation en pause, sans reprise automatique.

## Interface et accessibilité

Sur grand écran : terrain à gauche ; compteurs, options et commandes empilés à droite ; graphique en dessous à gauche et feedback à droite. Sur petit écran, les blocs s’empilent pour rester lisibles et les commandes passent avant le terrain.

- Souris, stylet et toucher : glisser-déposer, ou sélection puis association.
- Au toucher, faire défiler depuis une zone qui n’est pas un lézard ; les lézards réservent le geste au déplacement.
- Clavier : Tab, Entrée/Espace, Échap pour annuler.
- Le tableau contient tous les relevés depuis le départ ; il est défilant. Reset efface l’historique de la session précédente.
- Les résultats restent en mémoire dans la page jusqu’au reset ou à sa fermeture. Pas de compte élève, installation, base de données ni envoi des données.

## Règles et extensions

- Départ normal : 10 lézards et 30 ressources, réparties 10 Food / 10 Water / 10 Shelter.
- Positions aléatoires dans des cases séparées pour garder les cibles lisibles. Cette grille et la répartition équilibrée sont des choix de conception, pas des valeurs imposées par Ileah.
- Mauvaise ressource : aucune consommation ; le délai continue.
- À chaque mort, une nouvelle ressource aléatoire apparaît. Graphique et compteurs enregistrent cet événement immédiatement, même entre deux secondes.
- Sans incendie, lézards + ressources = 40.
- **Drought** : poids Food/Water/Shelter = 2/1/2 pour les ressources retournées (40 % / 20 % / 40 %). L’eau est donc deux fois moins probable que chacune des autres ressources, et non une probabilité absolue de 50 %. Le départ conserve 30 ressources avec 12/6/12 pour rendre la condition visible dès le début. Ce choix initial est documenté pour revue DRI.
- **Wildfire** : intervalle aléatoire uniforme de 20 à 40 secondes de simulation. Tous les abris disparaissent ; aucune restauration automatique programmée. Des morts ultérieures peuvent produire du sagebrush. Les incendies diminuent le total lézards + ressources : la conservation à 40 ne s’applique plus.
- Les deux extensions sont désactivées au départ. Elles sont présentes pour répondre à la demande d’appliquer tous les éléments de l’audit ; Ileah permettait de les reporter après le prototype.

L’historique complet est conservé en mémoire et enregistré chaque seconde, à chaque association réussie, à chaque mort, à chaque incendie et à la pause. Aucune stabilisation ni tendance n’est artificiellement ajoutée aux courbes.

## Vérifications

Les tests du moteur et des données couvrent notamment : échéances exactes, pause, reset, reproduction, mort et retour de ressource, mises à jour entre deux secondes, historique complet, fréquence de l’eau, incendie et retour naturel des abris.

Les essais reproductibles `../work/calibrate.cjs` simulent des associations toutes les 0,5, 1 ou 1,5 seconde sur deux minutes, avec trois graines aléatoires, avec/sans extensions. Ils servent à examiner le comportement, pas à certifier l’expérience des élèves. À une association par seconde, les scénarios de base oscillent entre 14 et 15 lézards pendant la deuxième minute. Le rythme des associations influence donc fortement le plateau. La calibration pédagogique reste à faire avec DRI et des utilisateurs réels ; notamment l’intensité des effets sécheresse/incendie.

**Limite de vérification :** aucun rendu navigateur ni geste tactile réel n’a été confirmé dans cet environnement. Les restrictions précédemment rencontrées n’ont pas été contournées. Les scénarios navigateur `../work/verify-ui.cjs` ont été adaptés, mais restent à exécuter dans un environnement autorisé. Aucune certification Section 508 ni validation graphique DRI n’est revendiquée.

Rien n’a été publié sur GitHub ou en ligne. L’hébergement final, la revue graphique/pédagogique DRI et les tests multi-navigateurs/appareils restent à organiser.

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
