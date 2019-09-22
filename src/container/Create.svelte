<script>
  import shortid from "shortid";
  let sessionName;

  function createSession() {
    console.log(shortid.generate());
  }
</script>

<style>

</style>

<section class="input-form">
  <h3>Create a session</h3>
  <section class="input-block">
    <label>Name:</label>
    <input type="text" class="input-text" bind:value={sessionName} />
  </section>
  <button
    class="success"
    on:click={() => {
      createSession();
    }}>
    Create
  </button>
</section>
