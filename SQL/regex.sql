/*
REGEX LEARNING NOTES

SQL operator used here (PostgreSQL):
	~       matches the regular expression (case-sensitive)
	~*      matches the regular expression (case-insensitive)
	!~      does not match the regular expression (case-sensitive)
	!~*     does not match the regular expression (case-insensitive)

MySQL differences (MySQL 8+):
	REGEXP  or RLIKE: matches the regular expression
	NOT REGEXP:      does not match the regular expression
	REGEXP_LIKE():   function form; use REGEXP_LIKE(mail, pattern, 'c') for
	                 case-sensitive matching or 'i' for case-insensitive matching
	Case sensitivity normally follows the column collation. The 'c' match type
	forces case-sensitive matching, while 'i' forces case-insensitive matching.

Equivalent MySQL query:
	SELECT user_id, name, mail
	FROM Users
	WHERE REGEXP_LIKE(
		mail,
		'^[A-Za-z][A-Za-z0-9_.-]*@leetcode\\.com$',
		'c'
	);

MySQL escaping detail:
	In a normal MySQL string literal, the backslash is itself escaped, so the
	regex literal period is written as '\\\\.' in SQL. With the
	NO_BACKSLASH_ESCAPES SQL mode enabled, '\\.' is sufficient instead.
	PostgreSQL and MySQL both use ^, $, character classes, quantifiers, groups,
	and alternation here, so the pattern logic is otherwise the same.

Regex rules used in the query:
	^       start-of-string anchor: the match must begin at the first character
	$       end-of-string anchor: the match must end at the last character
	[ABC]   character class: match exactly one of A, B, or C
	[A-Z]   range inside a class: any uppercase letter from A through Z
	[a-z]   range inside a class: any lowercase letter from a through z
	[0-9]   range inside a class: any digit from 0 through 9
	[_.-]   class containing underscore, period, and hyphen
	*       quantifier: repeat the preceding token zero or more times
	+       quantifier: repeat the preceding token one or more times
	?       quantifier: repeat the preceding token zero or one time
	{n}     repeat the preceding token exactly n times
	{n,m}   repeat the preceding token between n and m times
	.       wildcard: any character (escape it when a literal period is needed)
	\.      escaped period: a literal period, rather than the wildcard
	|       alternation: match the expression on either side
	(...)   capturing group: treat several tokens as one unit
	\d      digit shorthand (dialect support varies; [0-9] is more portable)
	\s      whitespace shorthand (dialect support varies)
	\w      word-character shorthand (dialect support varies)
	[^ABC]  negated class: one character that is not A, B, or C

Email pattern, read left to right:
	^                         begin at the start of the email
	[A-Za-z]                  first character must be a letter
	[A-Za-z0-9_.-]*           then allow zero or more letters, digits, _, ., or -
	@                         require one literal at-sign
	leetcode                  require this exact domain name
	\.                        require one literal period before the top-level domain
	com                       require this exact top-level domain
	$                         finish at the end of the email

Why both ^ and $ matter:
	Without them, a valid-looking substring could match inside invalid text.
	Anchoring makes the whole value obey the rule.

Useful regex examples:
	'^[0-9]+$'                one or more digits, and nothing else
	'^[A-Za-z]+$'              one or more ASCII letters
	'^[^@]+@[^@]+$'            simple shape: text@text
	'^(cat|dog)$'              exactly "cat" or exactly "dog"
	'^.{8,}$'                 any value with at least eight characters

Important: regex behavior and escaping can vary between SQL dialects and
string-literal settings. Prefer explicit classes such as [0-9] when portability
matters, and test edge cases such as empty strings, spaces, and extra text.
*/

select user_id, name, mail
from Users
where mail ~ '^[A-Za-z][A-Za-z0-9_.-]*@leetcode\.com$'