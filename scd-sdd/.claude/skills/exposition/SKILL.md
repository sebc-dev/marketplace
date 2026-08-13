---
name: exposition
description: |
  La MÉTHODE D'EXPOSITION d'un arbitrage à l'humain qui n'a pas fait l'instruction :
  l'ordre des couches, le mécanisme expliqué quand le choix en dépend, le raisonnement
  raconté en scène, la longueur réglée sur l'enjeu. DEUX RÉGIMES — options concurrentes
  (un sujet, plusieurs issues) et gate d'approbation (N items à trier) — qui changent
  l'usage de l'ordre, jamais la méthode. Se charge pendant /scd-sdd:stack, archi, adr,
  ci, research, resume, premortem, audit, revise-contract et migrate, à l'étape qui
  restitue. Porte UNIQUEMENT l'exposition : les six règles de langage restent dans le
  ## Règles absolues de chaque commande (DECISIONS.md §D32) et tiennent sans lui ; le
  contenu de l'arbitrage appartient au skill de son niveau ; la ligne de journal au
  skill journal. Ne prescrit aucun gabarit : un plan-type en huit sections sur une
  question qui en demande deux est le même défaut par l'autre bout.
---

# Exposition — restituer un arbitrage à qui n'a pas instruit

## Pourquoi une méthode, et pas des règles de plus

Le plugin porte déjà six règles de langage (§D32), recopiées dans le `## Règles absolues` de
23 commandes. Elles gouvernent la **phrase** : un mot nu, un ID nu, une option sans conséquence.

Elles ne suffisent pas, et on le sait par un cas réel : un texte qui **respectait quatre des six**
a été jugé incompréhensible par l'humain qui devait trancher. Les deux règles violées auraient pu
être corrigées sans le rendre décidable pour autant. L'obstacle n'était pas dans les mots — il était
dans l'**ordre** et dans les **couches**.

D'où la frontière, qui tient dans une ligne : **§D32 gouverne la phrase, ce skill gouverne
l'exposition.** Les six règles ne sont pas ici, et elles s'appliquent même quand ce skill n'est pas
chargé.

Le déséquilibre à corriger a toujours la même forme. Tu as instruit : tu connais l'objet, tu as fait
les mesures, tu as écarté trois pistes. **L'humain n'a rien de tout ça.** Restituer, ce n'est pas
résumer ce que tu as trouvé — c'est reconstruire ce qu'il lui faut pour trancher.

## Ce qui ne change jamais — les sept points

### 1. L'ordre d'exposition n'est pas l'ordre d'instruction

Le réflexe est de restituer dans l'ordre du travail : ce que tu as mesuré d'abord, puis tes
objections, puis les options. Cet ordre est le tien. Il suppose acquis, dès la première ligne, tout
ce que l'instruction t'a appris.

L'ordre à tenir est celui de la **compréhension** : l'objet dont on parle et à quoi il sert → ce qui
est promis ou prévu aujourd'hui → ce qui cloche → le mécanisme du remède → son prix → les options →
la recommandation.

**L'objet vient avant le problème.** « Le compteur de fréquence est ce qui empêche de spammer le
formulaire ; deux exigences le demandent » précède « son empreinte est énumérable ». Un problème
posé sur un objet inconnu ne se juge pas.

### 2. Une glose ne remplace pas un mécanisme

La glose de §D32 **nomme** : une ligne, une fois. Elle suffit quand le terme est une étiquette.

Elle ne suffit pas quand le choix **dépend d'une propriété** du mécanisme. Alors c'est la propriété
qu'on explique, pas le mot — et le test est simple : *si l'humain ignore cette propriété, peut-il
choisir ?* Si non, elle n'est pas un préambule, elle **est** l'argument, et elle a droit à la place
que ça demande.

Le signe qu'on est dans ce cas : la propriété que le sens commun croit protectrice n'est pas celle
qui compte.

### 3. Un raisonnement se raconte en scène

Un mode de défaillance, une attaque, une régression ne s'énoncent pas en propriété — ils se
racontent : **un acteur, un geste, un résultat**. « On teste un candidat » est exact et ne se voit
pas. « Je connais son adresse, je la hache une fois, je regarde si elle est dans la table » se voit.

Une analogie courte vaut un paragraphe, à condition qu'elle porte la **différence** qui compte et
non une ressemblance vague.

### 4. Un chiffre ne se montre que dans l'unité de la décision

Le calcul intermédiaire est **fait, pas montré**. Des débits en M/s ne se comparent pas ; des durées
si. Donne la grandeur sur laquelle la décision se prend, et dis avant le chiffre à quelle question
il répond.

Une mesure faite par toi se déclare comme telle, avec ce qui la borne — la machine, la méthode. Une
mesure sans provenance ne se vérifie pas et ne devrait pas peser.

### 5. Un ID porte ce que sa décision a fait

§D32 demande l'intitulé. Dans une restitution, ça ne suffit pas : si l'argument **s'appuie** sur un
`FR`, un ADR, un invariant, un constat d'audit, dis ce que la décision **a fait**.

« Cette option revient sur S-05 » ne pèse rien. « L'arbitrage S-05, hier, a retiré un secret de
l'inventaire et l'a compté comme un gain — cette option l'y remet » pèse, et se conteste.

### 6. La longueur se règle sur l'enjeu de la décision

§D32 borne la **glose** à une ligne. Ce n'est pas un plafond de rendu, et la restitution d'un
arbitrage est précisément le genre de texte où la compression coûte le plus : un texte trop court
oblige à redemander, ce qui coûte un tour complet.

**Ce n'est pas un permis de verbosité.** Le critère est net : chaque paragraphe doit être nécessaire
pour **trancher**. Ce qui documente ton travail sans changer le choix se coupe — l'humain n'a pas à
lire ton instruction pour valider ta conclusion.

### 7. L'interprétation se déclare là où elle est faite

Ce qui est une lecture d'un document ambigu, une hypothèse ou un point non sourcé se dit **à
l'endroit où on s'en sert**, pas en réserve finale. « C'est ma lecture de cette phrase, pas un
fait » au milieu du raisonnement vaut mieux qu'une prudence en bas de page.

Et une recommandation qui compte **énumère** : « les quatre problèmes » suivi des quatre. Un compte
non énuméré ne se vérifie pas.

## Ce qui change — les deux régimes

La méthode ne change pas ; ce que l'humain doit faire change, et donc l'usage de l'ordre.

| | Régime **options** | Régime **gate** |
|---|---|---|
| Ce qu'il reçoit | **un** sujet, plusieurs issues | **N** items indépendants |
| Ce qu'il fait | choisit une issue | approuve ou rejette, item par item |
| Rôle de l'ordre (point 1) | **faire comprendre** — en plein | **trier** — une fois, en tête |
| Longueur (point 6) | l'enjeu du choix | le **nombre** d'items |

### Régime options — `stack` · `archi` · `adr` · `ci` · `research` · `resume`

Les sept points s'appliquent en plein. Chaque option porte **ce qu'on paie** en termes du projet —
ce qui s'ajoute à entretenir, ce qui se perd, qui devra le porter —, jamais un nom de procédure
interne. Une recommandation se donne, avec son motif ; l'absence de recommandation fait porter à
l'humain un travail que tu viens de faire.

Quand une option est écartée d'avance par un fait établi plus haut, dis-le **là où le fait est
posé** : ça évite quatre options dont deux sont mortes.

### Régime gate — `premortem` · `audit` · `revise-contract` · `migrate`

L'humain ne choisit pas entre des issues : il passe une liste. Le piège est symétrique, et les deux
moitiés se ratent facilement — répéter le décor à chaque item produit trente préambules et noie le
tri ; le supprimer rend chaque item injugeable seul.

La sortie tient en trois gestes :

- **un décor commun, une fois, en tête** — ce qui a été examiné, contre quoi, ce que le verdict
  d'ensemble veut dire. Le point 1 se joue là, et **nulle part ailleurs** ;
- **un item ne porte que ce qui lui est propre**, plus une chose que le décor ne peut pas donner :
  **ce qui se passe si on ne l'approuve pas** ;
- **regroupe ce qui se décide ensemble.** Dix items qui tiennent au même motif se présentent comme
  un motif et dix conséquences, pas comme dix arbitrages.

**Deux points changent d'usage, cinq restent entiers, et il n'y a pas de reste.** Le **1** et le
**6** sont ceux que la table ci-dessus re-cadre — l'ordre se joue en tête et une seule fois, la
longueur se règle sur le nombre d'items. Les **2**, **3**, **4**, **5** et **7** s'appliquent tels
quels : un item dont le mécanisme n'est pas compris ne se juge pas plus qu'une option, un chiffre
s'y donne dans l'unité de la décision, et un ID y porte ce que sa décision a fait.

⚠️ Le point **7** est le plus sollicité des cinq, parce qu'un gate produit des comptes. Le décor
annonce « 2 Critical, 3 Major » ou « quatre problèmes » : un compte ne vaut que **énuméré**, et
l'énumération se fait là où le compte est donné. Et l'interprétation se déclare **sur l'item qui
s'en sert** — jamais dans le décor, qui est commun quand une lecture discutable, elle, ne l'est
pas.

## Un exemple travaillé

Même contenu, même conclusion. Le premier est indécidable.

> **Avant.** « La réversibilité n'est pas le vrai défaut. On n'inverse pas une empreinte, on teste un
> candidat : "l'adresse de cette personne est-elle dans la table ?" coûte un hachage et une
> comparaison. La taille de l'espace ne sauve donc rien — l'IPv6 pas davantage que l'IPv4. »

> **Après.** « On n'a pas besoin de remonter. Il suffit d'essayer.
>
> Imagine que je veuille savoir si une personne précise est passée sur le site — un journaliste, un
> concurrent, un ex. Je connais son adresse : je la hache une fois, et je regarde si le résultat est
> dans la table.
>
> C'est la différence entre casser un coffre et essayer une clé qu'on a déjà. Et cette attaque-là se
> moque de la taille de l'espace : elle marche aussi bien sur les 2¹²⁸ adresses de l'IPv6. »

Trois points ont joué : **2** — la propriété qui compte (l'empreinte est *reproductible*) est
expliquée, pas nommée ; **3** — un acteur, un geste, un résultat, plus l'analogie qui porte la
différence ; **6** — c'est trois fois plus long, et c'est ce qui le rend décidable.

Ce n'est pas un gabarit. C'est ce qui a marché **une fois**, sur un sujet dense.

## Ce que l'exposition n'est pas

- **Ce n'est pas un plan-type.** L'ordre du point 1 est une **contrainte de dépendance** — ne rien
  supposer d'acquis qui n'ait été donné —, pas un sommaire à remplir.
- **Ce n'est pas de la vulgarisation systématique.** On explique ce dont le **choix** dépend. Le
  reste se nomme et se laisse.
- **Ce n'est pas de la condescendance.** L'extinction de §D32 vaut ici aussi : dès que l'humain
  emploie un terme lui-même, il n'a plus besoin qu'on le lui explique.
- **Ce n'est pas une réécriture du contenu.** Ce skill change la façon dont un arbitrage est
  présenté, jamais ce qui est arbitré ni ce qui est écrit sur disque.
- **Aucune `references/`.** Tout tient ici. Le corpus complet dont l'exemple est tiré vit dans le
  dépôt de développement du plugin, et n'est chargé nulle part.
