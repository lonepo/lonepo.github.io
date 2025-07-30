---

layout: default

title: Home

---

\# Recent Articles



<ul class="space-y-4">

&nbsp; {% for post in site.posts %}

&nbsp;   <li>

&nbsp;     <a href="{{ post.url }}" class="text-xl hover:underline">

&nbsp;       {{ post.title }}

&nbsp;     </a>

&nbsp;     <p class="text-sm text-gray-500 dark:text-gray-400">

&nbsp;       {{ post.date | date: "%B %-d, %Y" }}

&nbsp;     </p>

&nbsp;   </li>

&nbsp; {% endfor %}

</ul>



